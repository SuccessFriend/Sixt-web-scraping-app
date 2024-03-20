const puppeteer = require('puppeteer');
const fs = require('fs');
const csv = require('csv-parser');
const { Parser } = require('json2csv');
const { PassThrough } = require('stream');
const { start } = require('repl');

let parser = new Parser();

async function getSelectedLoactionID() {

    const data = await readFileSequentially("location_id_list.csv");
    for (const row of data) {
        const location_id = row[2];
        for (let j = 1; j < 10; j++) {
            
            await fetch("https://grpc-prod.orange.sixt.com/com.sixt.service.rent_booking.api.SearchService/SelectLocation", {
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
                "body": `{\"user_profile_id\":\"\",\"location_purpose\":${j},\"vehicle_type\":1,\"auto_complete_session_id\":\"18d74eee-134d-4a63-b049-0b379a6deb71\",\"location_id\":\"${location_id}\",\"include_fastlane\":null}`,
                "method": "POST"
            })
                .then(response => {
                    if (response.ok) {
                        // console.log("response okay!");
                        return response.json(); // assuming the response is in JSON format
                    } else {
                        // console.log("Request failed with status " + response.status);
                    }
                })
                .then(data => {
                    const location_selection_id = data.location_selection_id;
                    const title = data.selected_location.title;

                    const appendData = { 'location_id': location_id, 'title': title, 'location_selection_id': location_selection_id };
                    const csv = parser.parse(appendData);
                    const csvDataWithoutHeader = csv.split('\n')[1] + '\n';
                    fs.appendFileSync("location_selected_id.csv", csvDataWithoutHeader, 'utf8', (err) => {
                        if (err) {
                            console.error('Error appending to CSV file:', err);
                        } else {
                            console.log('CSV data appended successfully.');
                        }
                    });
                })
                .catch(error => {
                    // handle any errors that occurred during the request
                    // console.error("No match result ...", error);
                });
            
        }
            
    }
    // console.log(location_id_list)

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

getSelectedLoactionID();
