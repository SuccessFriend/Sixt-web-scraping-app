const puppeteer = require('puppeteer');
const fs = require('fs');
const csv = require('csv-parser');
const { Parser } = require('json2csv');
const { PassThrough } = require('stream');
const { start } = require('repl');

let percentage = 0;
let scrapeStartDate = "";

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getLoactionID(givenDate) {
    const nowDate = new Date();

    let keyCount = 0;
    percentage = 0;
    scrapeStartDate = givenDate;

    const appendHeader = { 'Pickup Date': "Pickup Date", 'Return Date': "Return Date", 'Country': "Country", 'Location': "Location", 'Title': "Title", 'Sit': "Sit", 'Limit': "Limit", 'Price per day': "Price per day", 'Total Price': "Total Price", 'Toll pass': "Toll pass" };
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

    const browser = await puppeteer.launch({
        headless: false,
        // args: ['--incognito'],
        args: ['--incognito', '--start-maximized'],
    });

    const page = await browser.newPage();
    await page.setViewport({width: 1920, height: 1080});

    for (let date_count = 0; date_count < 30; date_count++) {
                
        const newDate = new Date(givenDate + "-01");
        newDate.setDate(newDate.getDate() + date_count);
        let startDate = newDate.toISOString().split('T')[0];
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
            let endDate = newDate.toISOString().split('T')[0];
            
            const data = await readFileSequentially("sixtcities.csv");
            for (const row of data) {
                
                keyCount = keyCount + 1;
                percentage = keyCount
                console.log("percentage: ", keyCount);
                
                let country_code_list = [];
                let title_list = [];
                let location_id_list = [];

                const searchKey = row[1];
                console.log(">>> ", searchKey);
                for (let i = 1; i < 5; i++) {

                    await fetch("https://grpc-prod.orange.sixt.com/com.sixt.service.rent_booking.api.SearchService/SuggestLocations", {
                        "headers": {
                            "accept": "*/*",
                            "accept-language": "en-US,en",
                            "content-type": "application/json",
                            "sec-ch-ua": "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Google Chrome\";v=\"122\"",
                            "sec-ch-ua-mobile": "?0",
                            "sec-ch-ua-platform": "\"Windows\"",
                            "sec-fetch-dest": "empty",
                            "sec-fetch-mode": "cors",
                            "sec-fetch-site": "same-site",
                            "sx-platform": "web-next",
                            "x-client-id": "web-browser-2501006464537361220005373651080192024",
                            "x-client-type": "web",
                            "x-correlation-id": "5a576cbc-d086-40e6-acfe-6b841dde1263",
                            "x-sx-o-client-id": "296ca977-6c8a-4765-9488-4d411eacd1a4:oeu1710604378799r0.6026082363877963",
                            "x-sx-t-client-id": "00000000000000000000000000000000",
                            "x-sx-tenant": "6",
                            "Referer": "https://www.sixt.com/",
                            "Referrer-Policy": "strict-origin-when-cross-origin"
                        },
                        "body": `{\"query\":\"${searchKey}\",\"auto_complete_session_id\":\"9277d94b-c4f1-4299-a02e-eaf7ff5038c0\",\"vehicle_type\":\"${i}\",\"user_profile_id\":\"\",\"location_purpose\":1,\"include_fastlane\":null}`,
                        "method": "POST"
                    })
                        .then(response => {
                            if (response.ok) {
                                return response.json();
                            } else {
                            }
                        })
                        .then(data => {
                            const suggestions = data.suggestions;
                            for (let j = 0; j < suggestions.length; j++) {
                                const suggestion = suggestions[j];
            
                                const country_code = suggestion.location.branch.country_code;
                                const title = suggestion.location.title;
                                const location_id = suggestion.location.location_id;
            
                                if (country_code && title && location_id) {
                                    if (location_id_list.includes(location_id)) {
                                        continue;
                                    } else {
                                        country_code_list.push(country_code);
                                        title_list.push(title);
                                        location_id_list.push(location_id);
                                    }   
                                }
                            }
                        })
                        .catch(error => {
                            // handle any errors that occurred during the request
                        });
                }
                for (let k = 0; k < country_code_list.length; k++) {
                    
                    let country_code = country_code_list[k];
                    let search_text = title_list[k];
                    let location_id = location_id_list[k];
    
                    for (let g = 0; g < 1; g++) {
                        
                        let fetch_result = await fetch("https://grpc-prod.orange.sixt.com/com.sixt.service.rent_booking.api.SearchService/SelectLocation", {
                            "headers": {
                                "accept": "*/*",
                                "accept-language": "en-US,en",
                                "content-type": "application/json",
                                "sec-ch-ua": "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Google Chrome\";v=\"122\"",
                                "sec-ch-ua-mobile": "?0",
                                "sec-ch-ua-platform": "\"Windows\"",
                                "sec-fetch-dest": "empty",
                                "sec-fetch-mode": "cors",
                                "sec-fetch-site": "same-site",
                                "sx-platform": "web-next",
                                "x-client-id": "web-browser-2501006464537361220005373651080192024",
                                "x-client-type": "web",
                                "x-correlation-id": "4bd3b535-2981-42f9-b0cc-578568e10861",
                                "x-sx-o-client-id": "45addb33-8208-4057-99f6-9ecc5bcea8e4:oeu1708056517957r0.32718956412693223",
                                "x-sx-t-client-id": "00000000000000000000000000000000",
                                "x-sx-tenant": "6",
                                "Referer": "https://www.sixt.com/",
                                "Referrer-Policy": "strict-origin-when-cross-origin"
                            },
                            "body": `{\"user_profile_id\":\"\",\"location_purpose\":${g},\"vehicle_type\":1,\"auto_complete_session_id\":\"18d74eee-134d-4a63-b049-0b379a6deb71\",\"location_id\":\"${location_id}\",\"include_fastlane\":null}`,
                            "method": "POST"
                        })
                            .then(response => {
                                if (response.ok) {
                                    return response.json();
                                } else {
                                }
                            })
                            .then(firstData => {
                                const location_selection_id = firstData.location_selection_id;
                                return {location_selection_id};
                            })
                            .catch(error => {
                                // handle any errors that occurred during the request
                            });
                        
                        const location_selection_id = fetch_result.location_selection_id;
                        location_id = location_id.replace(":", "%3A");
                        let search_title = search_text.replace("/", "%2F");
                        search_title = search_title.replace(" ", "%20");
                        search_title = search_title.replace(" ", "%20");
    
                        const offerURL = `https://www.sixt.com/betafunnel/#/offerlist?zen_pu_location=${location_selection_id}&zen_do_location=${location_selection_id}&zen_pu_title=${search_title}&zen_do_title=${search_title}&zen_pu_time=${startDate}T12%3A30&zen_do_time=${endDate}T09%3A00&zen_pu_branch_id=${location_id}&zen_do_branch_id=${location_id}&zen_vehicle_type=car&zen_pickup_country_code=${country_code}&zen_resident_country_required=false&olpv=rof&zen_filters=%7B%22group_type%22%3A%5B%5D%2C%22transmission_type%22%3A%5B%5D%2C%22passengers_count%22%3A%5B%5D%2C%22large_bags_count%22%3A%5B%5D%2C%22minimum_driver_age%22%3A%5B%5D%7D`;
    
                        async function openPage(offerURL) {
                            await page.goto(offerURL, {
                                timeout: 500000
                            });
                            await page.reload();
                            await delay(5000);
                            
                            let titleArray = [];
                            let sitArray = [];
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
                                    
                                    
                                    const sits = await page.$x('//*[@id="rent-offer-list-container"]/div/div[4]/div/div/div/a/div/div[1]/div[2]/div[1]');
                                    for (const sit of sits) {
                                        const text = await page.evaluate(el => el.textContent, sit);
                                        sitArray.push(text.trim());
                                    }

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
                                        await delay(2000);
    
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
    
                                        const peace_button = '//*[@id="rent-checkout-container"]/div/div/div/div/div/div/div/form/div/div[4]/label';
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
                                            const tollpass_path = '//*[@id="rent-checkout-container"]/div/div[2]/div/div[1]/div/form/div[5]/div/div/div[2]';
                                            tollpass_text = await page.evaluate((tollpass_path) => {
                                                const tollpass_text = document.evaluate(tollpass_path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                                                const tollpass_title = document.evaluate('//*[@id="rent-checkout-container"]/div/div[2]/div/div[1]/div/form/div[5]/div/div/div[1]/div[2]/div[1]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                                                
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
                                        sitArray.push("");
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
                                            const tollpass_path = '//*[@id="zen-offer-checkout-container"]/div/div[2]/div[2]/div[1]/form/div/div[5]/div/div/div/div[2]/div[3]';
                                            tollpass_text = await page.evaluate((tollpass_path) => {
                                                const tollpass_text = document.evaluate(tollpass_path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                                                const tollpass_title = document.evaluate('//*[@id="zen-offer-checkout-container"]/div/div[2]/div[2]/div[1]/form/div/div[5]/div/div/div/div[2]/div[1]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                                                
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
                                    const sit = sitArray[i];
                                    const limit = limitArray[i];
                                    const dailyprice = dailypriceArray[i].split("/")[0];
                                    const totalprice = totalpriceArray[i].replace("total", "");
                                    
                                    const result = { 'Pickup Date': startDate, 'Return Date': endDate, 'Country': country_code, 'Location': search_text, 'Title': title, 'Sit': sit, 'Limit': limit, 'Price per day': dailyprice, 'Total Price': totalprice, 'Toll pass': tollpass_text};
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
                        try {
                            await openPage(offerURL);
                        } catch (error) {
                        }
                    }
                }
            }
        }
    }
    async function readFileSequentially(filePath) {
        return new Promise((resolve, reject) => {
            let data = [];

            fs.createReadStream(filePath, { encoding: 'utf8' })
                .pipe(csv({ separator: ',', headers: false }))
                .on('data', chunk => {
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

}

function percentFunction() {
    return { percentage, scrapeStartDate }
}

// module.exports = {
//     getLoactionID,
//     percentFunction,
// }
getLoactionID("2024-04");
