const puppeteer = require('puppeteer');
// const puppeteer = require('puppeteer-firefox');
const fs = require('fs');
const csv = require('csv-parser');
// const Result = require('./schema');
const { Parser } = require('json2csv');
const { PassThrough } = require('stream');
const { start } = require('repl');

let percentage = 0;
let scrapeStartDate = "";

async function scrapFunction(givenDate) {

    const nowDate = new Date();
    const Today = String(nowDate).split("T")[0];
    // console.log(Today);
    if (Today == "2024-03-12") {
        console.log("Just today!")
    } else {
        // console.log("Not yet!")
        percentage = 0;
        var newLine = '\r\n';
        var result = {};
        let results = [];
        let count = 0;
        let keyCount = 0;
        scrapeStartDate = givenDate;
    
        let appendHeader = { 'Pickup Date': "Pickup Date", 'Return Date': "Return Date", 'State': "State", 'Location': "Location", 'Title': "Title", 'Limit': "Limit", 'Price per day': "Price per day", 'Total Price': "Total price", 'Toll pass': "Toll pass"};
        let parser = new Parser();
        let headerData = parser.parse(appendHeader);
        let csvHeader = headerData.split('\n')[1] + '\n';
        let resultFileName = "./Result/Sixt" + givenDate + ".csv";
    
        fs.appendFileSync(resultFileName, csvHeader, 'utf8', (err) => {
            if (err) {
                console.error('Error appending to CSV file:', err);
            } else {
                console.log('CSV header appended successfully.');
            }
        });
    
        async function handleScraping() {
            for (let i = 0; i < 30; i++) {
                
                const newDate = new Date(givenDate + "-01");
                newDate.setDate(newDate.getDate() + i);
                const startDate = newDate.toISOString().split('T')[0];
                console.log("Date: ", startDate);
                let givenDateObj = new Date(newDate);

                givenDateObj.setHours(0, 0, 0, 0);
                nowDate.setHours(0, 0, 0, 0);

                if (givenDateObj < nowDate) {
                    // console.log("unavailable date!")
                    keyCount = keyCount + 221;
                    percentage = keyCount
                } else {

                    newDate.setDate(newDate.getDate() + 365);
                    const endDate = newDate.toISOString().split('T')[0];
        
                    // Delay function
                    function delay(ms) {
                        return new Promise((resolve) => setTimeout(resolve, ms));
                    }

                    async function openLocation(filePaths) {
                        
                        const data = await readFileSequentially(filePaths);
                        for (const row of data) {
                            const state = row[0];
                            const searchKey = row[1];
                            console.log("SearchKey >>> ", searchKey)
                            const link = row[2];
                            
                            keyCount = keyCount + 1;
                            percentage = keyCount
                            console.log("percentage: ", keyCount);
                            
                            try {
                                const browser = await puppeteer.launch({
                                    headless: false,
                                    // args: ['--incognito'],
                                    args: ['--incognito', '--start-maximized'],
                                });
                
                                const page = await browser.newPage();
                                await page.setViewport({width: 1920, height: 1080});
                
                                await page.goto('https://www.sixt.com/', {
                                    timeout: 500000
                                });

                                await delay(3000);

                                try {
                                    await page.evaluate(() => document.querySelector('#usercentrics-root').shadowRoot.querySelector('button[aria-label="OK, Agree to CCPA"]').click());
                                } catch (error) {
                                    console.log("Can't find Modal. ", error?.data || error.message || error);
                                }

                                const location_input_xpath = 'input[name="pickupLocation"]';
                                await page.waitForSelector(location_input_xpath, { timeout: 3000 });
                                await page.type(location_input_xpath, searchKey);

                                await delay(5000);

                                let dropdown_list_xpath = '//*[@id="rentsearch_root"]/div/div/div[1]/div/div/div/div[2]';
                                let dropdown_count = await page.evaluate((dropdown_list_xpath) => {
                                    const available_locations = document.evaluate(dropdown_list_xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                                    return available_locations.snapshotLength;
                                }, dropdown_list_xpath);

                                for (let i = 1; i < dropdown_count + 1; i++) {
                                    
                                    await page.goto('https://www.sixt.com/', {
                                        timeout: 500000
                                    });

                                    await delay(5000);
                                    
                                    try {
                                        await page.evaluate(() => document.querySelector('#usercentrics-root').shadowRoot.querySelector('button[aria-label="OK, Agree to CCPA"]').click());
                                    } catch (error) {
                                        console.log("Can't find Modal. ", error?.data || error.message || error);
                                    }

                                    const location_input_xpath = 'input[name="pickupLocation"]';
                                    await page.waitForSelector(location_input_xpath, { timeout: 3000 });
                                    const valueLength = await page.evaluate((selector) => {
                                        return document.querySelector(selector).value.length;
                                    }, location_input_xpath);
                                    
                                    const backspaces = Array(valueLength).fill('\u0008').join('');
                                    await page.type(location_input_xpath, backspaces);
                                    await page.type(location_input_xpath, searchKey);
                                    await delay(5000);

                                    await page.evaluate((i) => {
                                        const available_location = document.evaluate(`//*[@id="rentsearch_root"]/div/div/div[1]/div/div[${i}]/div`, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

                                        if (available_location.snapshotLength > 0) {
                                            available_location.snapshotItem(0).click();
                                        } else {
                                            console.error("No element found at index", i);
                                        }
                                    }, i);
                                    
                                    await delay(1000);
                                    
                                    const pickup_element = await page.$('div[data-testid="rent-search-form-pickup-date-input"] button');
                                    const box = await pickup_element.boundingBox();
                                    const x = Math.round(box.x + box.width / 2);
                                    const y = Math.round(box.y + box.height / 2);
                                    await page.mouse.move(x, y);
                                    await page.mouse.click(x, y);

                                    await delay(1000);

                                    await page.evaluate((startDate, endDate) => {
                                        const pickup_buttons = Array.from(document.querySelectorAll(`time[datetime="${startDate}"] button`));
                                        if (pickup_buttons.length === 1) {
                                            pickup_buttons[0].click();
                                        } else if (pickup_buttons.length > 1) {
                                            for (let i = 0; i < pickup_buttons.length; i++) {
                                                if (!pickup_buttons[i].hasAttribute('disabled')) {
                                                    pickup_buttons[i].click();
                                                    break;
                                                }
                                            }
                                        }
                                        
                                        for (let i = 0; i < 12; i++) {
                                            try {
                                                const next_button = document.querySelector('button[aria-label="Next"]');
                                                next_button.click()
                                            } catch (error) {
                                                console.log("next done")                                            
                                            }
                                        }

                                        const return_buttons = Array.from(document.querySelectorAll(`time[datetime="${endDate}"] button`));
                                        if (return_buttons.length === 1) {
                                            return_buttons[0].click();
                                        } else if (return_buttons.length > 1) {
                                            for (let i = 0; i < return_buttons.length; i++) {
                                                if (!return_buttons[i].hasAttribute('disabled')) {
                                                    return_buttons[i].click();
                                                    break;
                                                }
                                            }
                                        }
                                    }, startDate, endDate);

                                    await delay(5000);
        
                                    const search_button_path = '/html/body/div[1]/div[1]/div[1]/div[2]/div[1]/div/div/div[2]/div[2]/div/div/div[2]/div/form/div[1]/div[2]/div[2]/div/button';
                                    await page.evaluate((search_button_path) => {
                                        const element = document.evaluate(search_button_path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                                        if (element) {
                                            element.click();
                                        } else {
                                            console.log("can't find submit button !")
                                        }
                                    }, search_button_path);
                                    
                                    await delay(15000);

                                    try {
                                        const second_locatoin_path = '//*[@id="rent-nearby-branches-container"]/div[2]/div[2]/div[1]/div[1]';
                                        await page.evaluate((second_locatoin_path) => {
                                            const element = document.evaluate(second_locatoin_path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                                            if (element) {
                                                element.click();
                                            } else {
                                                console.log("can't find second location button !")
                                            }
                                        }, second_locatoin_path);
                                        await delay(1000);

                                        const second_submit_button_path = '//*[@id="rent-nearby-branches-container"]/div[2]/div[2]/div[1]/div[1]/div/div[2]/div[7]/button';
                                        await page.evaluate((second_submit_button_path) => {
                                            const element = document.evaluate(second_submit_button_path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                                            if (element) {
                                                element.click();
                                            } else {
                                                console.log("can't find second submit button !")
                                            }
                                        }, second_submit_button_path);
                                        await delay(5000)
                                    } catch (error) {
                                        console.log("No second location !");
                                    }
                                    
                                    let titleArray = [];
                                    let limitArray = [];
                                    let dailypriceArray = [];
                                    let totalpriceArray = [];
                                    let tollpass_text = "";

                                    try {
                                        const title_elements = await page.$x('//*[@id="rent-offer-list-container"]/div/div[4]/div/div/div/a/div/div[1]/div[1]/div/h4');
                                        for (const title_element of title_elements) {
                                            const text = await page.evaluate(el => el.textContent, title_element);
                                            titleArray.push(text.trim());
                                        }
                                        if (titleArray.length > 0) {
                                            const racing_limits = await page.$x('//*[@id="rent-offer-list-container"]/div/div[4]/div/div/div/a/div/div[3]/div[1]/div/div[2]');
                                            for (const racing_limit of racing_limits) {
                                                const text = await page.evaluate(el => el.textContent, racing_limit);
                                                limitArray.push(text.trim());
                                            }

                                            const dailyprices = await page.$x('//*[@id="rent-offer-list-container"]/div/div[4]/div/div/div/a/div/div[3]/div[2]/div/span[1]');
                                            for (const dailyprice of dailyprices) {
                                                const text = await page.evaluate(el => el.textContent, dailyprice);
                                                dailypriceArray.push(text.trim());
                                            }

                                            const totalprices = await page.$x('//*[@id="rent-offer-list-container"]/div/div[4]/div/div/div/a/div/div[3]/div[2]/div/span[2]');
                                            for (const totalprice of totalprices) {
                                                const text = await page.evaluate(el => el.textContent, totalprice);
                                                totalpriceArray.push(text.trim());
                                            }

                                            try {
                                                const card_path = '//*[@id="rent-offer-list-container"]/div/div[4]/div[4]/div/div[1]/a';
                                                await page.evaluate((card_path) => {
                                                    const element = document.evaluate(card_path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                                                    element.click();
                                                }, card_path);
                                                await delay(1000);

                                                const card_button = '//*[@id="rent-offer-list-container"]/div/div[4]/div[5]/div/div/div[2]/div/div[2]/div[2]/button';
                                                await page.evaluate((card_button) => {
                                                    const element = document.evaluate(card_button, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                                                    if (element) {
                                                        element.click();
                                                    } else {
                                                        console.log("can't find card button !")
                                                    }
                                                }, card_button);
                                                await delay(3000);

                                                try {
                                                    const modal_button = '//*[@id="dialogDesc"]/form/div/div[4]/button[2]';
                                                    await page.evaluate((modal_button) => {
                                                        const element = document.evaluate(modal_button, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                                                        if (element) {
                                                            element.click();
                                                        } else {
                                                            console.log("can't find modal button !");
                                                        }
                                                    }, modal_button);
                                                    await delay(1000);
                                                } catch (error) {
                                                    console.log("No modal !");
                                                }

                                                const peace_button = '//*[@id="rent-checkout-container"]/div/div[2]/div/div/div[1]/div/div/form/div/div[4]/label';
                                                await page.evaluate((peace_button) => {
                                                    const element = document.evaluate(peace_button, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                                                    if (element) {
                                                        element.click();
                                                    } else {
                                                        console.log("can't find peace button !")
                                                    }
                                                }, peace_button);
                                                await delay(2000);

                                                const submit_peace_button = '//*[@id="rent-checkout-container"]/div/div[1]/div/div[2]/div/div[2]/button';
                                                await page.evaluate((submit_peace_button) => {
                                                    const element = document.evaluate(submit_peace_button, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                                                    if (element) {
                                                        element.click();
                                                    } else {
                                                        console.log("can't find submit peace button !")
                                                    }
                                                }, submit_peace_button);
                                                await delay(2000)

                                                try {
                                                    const tollpass_path = '//*[@id="rent-checkout-container"]/div/div[2]/div/div[1]/div/form/div[2]/div/div/div[2]';
                                                    tollpass_text = await page.evaluate((tollpass_path) => {
                                                        const tollpass_text = document.evaluate(tollpass_path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                                                        const tollpass_title = document.evaluate('//*[@id="rent-checkout-container"]/div/div[2]/div/div[1]/div/form/div[2]/div/div/div[1]/div[2]/div[1]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                                                        
                                                        if (tollpass_title.textContent == "Toll pass") {
                                                            return tollpass_text.textContent;
                                                        } else {
                                                            console.log("can't find submit peace button !")
                                                        }
                                                    }, tollpass_path);
                                                } catch (error) {
                                                    console.log("No toll pass !");
                                                }
                                            } catch (error) {
                                                console.log("wrong find way for tollpass!");
                                            }

                                        } else {
                                            const title_elements = await page.$x('//*[@id="zen-offer-list-container"]/div[2]/div[2]/div[2]/div[2]/div/div/div/div/div/button/div[1]/div[1]/div/div[1]');
                                            for (const title_element of title_elements) {
                                                const text = await page.evaluate(el => el.textContent, title_element);
                                                titleArray.push(text.trim());
                                            }

                                            const racing_limits = await page.$x('//*[@id="zen-offer-list-container"]/div[2]/div[2]/div[2]/div[2]/div/div/div/div/div/button/div[2]/div/div[3]');
                                            for (const racing_limit of racing_limits) {
                                                const text = await page.evaluate(el => el.textContent, racing_limit);
                                                limitArray.push(text.trim());
                                            }

                                            const dailyprices = await page.$x('//*[@id="zen-offer-list-container"]/div[2]/div[2]/div[2]/div[2]/div/div/div/div/div/button/div[3]/div[1]/div/div[1]/div');
                                            for (const dailyprice of dailyprices) {
                                                const text = await page.evaluate(el => el.textContent, dailyprice);
                                                dailypriceArray.push(text.trim());
                                            }

                                            const totalprices = await page.$x('//*[@id="zen-offer-list-container"]/div[2]/div[2]/div[2]/div[2]/div/div/div/div/div/button/div[3]/div[1]/div/div[2]/div');
                                            for (const totalprice of totalprices) {
                                                const text = await page.evaluate(el => el.textContent, totalprice);
                                                totalpriceArray.push(text.trim());
                                            }

                                            try {
                                                
                                                const card_path = '//*[@id="zen-offer-list-container"]/div[2]/div[2]/div[2]/div[2]/div/div/div/div[1]/div/button';
                                                await page.evaluate((card_path) => {
                                                    const element = document.evaluate(card_path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                                                    element.click();
                                                }, card_path);
                                                await delay(3000);

                                                try {
                                                    const modal_button = '//*[@id="dialogDesc"]/form/div/div[4]/button[2]';
                                                    await page.evaluate((modal_button) => {
                                                        const element = document.evaluate(modal_button, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                                                        if (element) {
                                                            element.click();
                                                        } else {
                                                            console.log("can't find modal button !");
                                                        }
                                                    }, modal_button);
                                                    await delay(1000);
                                                } catch (error) {
                                                    console.log("No modal !");
                                                }

                                                const peace_button = '//*[@id="zen-offer-checkout-container"]/div/div[2]/div[2]/div[1]/div/form/div/div[4]/div/div/div[2]/button';
                                                await page.evaluate((peace_button) => {
                                                    const element = document.evaluate(peace_button, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                                                    if (element) {
                                                        element.click();
                                                    } else {
                                                        console.log("can't find peace button !")
                                                    }
                                                }, peace_button);
                                                await delay(3000);

                                                try {
                                                    const tollpass_path = '//*[@id="zen-offer-checkout-container"]/div/div[2]/div[2]/div[1]/form/div/div[2]/div/div/div/div[2]/div[3]';
                                                    tollpass_text = await page.evaluate((tollpass_path) => {
                                                        const tollpass_text = document.evaluate(tollpass_path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                                                        const tollpass_title = document.evaluate('//*[@id="zen-offer-checkout-container"]/div/div[2]/div[2]/div[1]/form/div/div[2]/div/div/div/div[2]/div[1]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                                                        
                                                        if (tollpass_title.textContent == "Toll pass") {
                                                            return tollpass_text.textContent;
                                                        } else {
                                                            console.log("can't find submit peace button !")
                                                        }
                                                    }, tollpass_path);
                                                } catch (error) {
                                                    console.log("No toll pass !");
                                                }

                                            } catch (error) {
                                                console.log("wrong find way tollpass!");
                                            }

                                        }
                                    } catch (error) {
                                        
                                    }

                                    if (titleArray.length > 0) {
                                        for (let i = 0; i < titleArray.length; i++) {
                                            const title = titleArray[i];
                                            const limit = limitArray[i];
                                            const dailyprice = dailypriceArray[i].split("/")[0];
                                            const totalprice = totalpriceArray[i].replace("total", "");
                                            
                                            const result = { 'Pickup Date': startDate, 'Return Date': endDate, 'State': state, 'Location': searchKey, 'Title': title, 'Limit': limit, 'Price per day': dailyprice, 'Total Price': totalprice, 'Toll pass': tollpass_text};
                                            const csv = parser.parse(result);
                                            const csvDataWithoutHeader = csv.split('\n')[1] + '\n';
                                            fs.appendFileSync(resultFileName, csvDataWithoutHeader, 'utf8', (err) => {
                                                if (err) {
                                                    console.error('Error appending to CSV file:', err);
                                                } else {
                                                    console.log('CSV data appended successfully.');
                                                }
                                            });
                                        }
                                    }
                                }
                                await browser.close();
                            } catch (error) {
                                console.log("load location file error ...", error?.data || error.message || error);
                            }
                        }
                    }
                    const files = './sixtcities.csv';
                    await openLocation(files);
                }
            }
        }
    
        async function readFileSequentially(filePath) {
            return new Promise((resolve, reject) => {
                let data = [];
    
                fs.createReadStream(filePath, { encoding: 'utf8' })
                    .pipe(csv({ separator: ',', headers: false }))
                    .on('data', chunk => {
                        // console.log('data-->', chunk)
                        data.push(chunk);
                    })
                    .on('end', () => {
                        resolve(data);
                    })
                    .on('error', error => {
                        reject(error);
                    });
            });
        }
    
        // date setting
        await handleScraping().then(res => {
            console.log('handle scraping have done!!')
        })
    
        return "Scraping was completed successfully!";
    }

}

function percentFunction() {
    return { percentage, scrapeStartDate }
}
module.exports = {
    scrapFunction,
    percentFunction,
}

// let givenDate = "2024-02";
// scrapFunction(givenDate);
