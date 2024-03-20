const puppeteer = require('puppeteer');
const fs = require('fs');
const csv = require('csv-parser');
const { Parser } = require('json2csv');
const { PassThrough } = require('stream');
const { start } = require('repl');

let parser = new Parser();

async function getCarInfo() {

    const data = await readFileSequentially("location_selected_id.csv");
    for (const row of data) {
        const location_selection_id = row[2];
        console.log("------ > ", location_selection_id);
            
            await fetch("https://grpc-prod.orange.sixt.com/com.sixt.service.rent_booking.api.BookingService/GetOfferRecommendationsV2", {
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
                    "x-correlation-id": "584674a9-b05b-4e29-9464-b967f580dc37",
                    "x-sx-o-client-id": "45addb33-8208-4057-99f6-9ecc5bcea8e4:oeu1708056517957r0.32718956412693223",
                    "x-sx-t-client-id": "00000000000000000000000000000000",
                    "x-sx-tenant": "6",
                    "Referer": "https://www.sixt.com/",
                    "Referrer-Policy": "strict-origin-when-cross-origin"
                },
                "body": `{\"offer_matrix_id\":\"82cab500-ede9-4ec8-8195-3b78985740ea\",\"currency\":\"USD\",\"trip_spec\":{\"pickup_datetime\":{\"value\":\"2024-04-26T12:30\"},\"pickup_location_selection_id\":\"${location_selection_id}\",\"return_location_selection_id\":\"${location_selection_id}\",\"return_datetime\":{\"value\":\"2024-05-15T09:00\"},\"vehicle_type\":10,\"user_profile_id\":\"\",\"corporate_customer_number\":\"\",\"campaign\":\"\"},\"enable_b2b_fallback\":true}`,
                "method": "POST"
            })
                .then(response => {
                    if (response.ok) {
                        console.log("response okay!");
                        return response.json(); // assuming the response is in JSON format
                    } else {
                        // console.log("Request failed with status " + response.status);
                    }
                })
                .then(data => {
                    console.log("data: ", data);
                    const offers = data.offers;
                    for (let i = 0; i < offers.length; i++) {
                        const offer = offers[i];
                        const title = offer.car_info.title;
                        const mileage = offer.mileage_included_formatted;
                        const price_per_day = offer.price_per_day.display_amount.value;
                        const price_total = offer.price_total.display_amount.value;
                        
                        console.log("result data : ", title, "-", mileage, "-", price_per_day, "-", price_total);

                        // const appendData = { 'location_id': location_id, 'title': title, 'location_selection_id': location_selection_id };
                        // const csv = parser.parse(appendData);
                        // const csvDataWithoutHeader = csv.split('\n')[1] + '\n';
                        // fs.appendFileSync("location_selected_id.csv", csvDataWithoutHeader, 'utf8', (err) => {
                        //     if (err) {
                        //         console.error('Error appending to CSV file:', err);
                        //     } else {
                        //         console.log('CSV data appended successfully.');
                        //     }
                        // });
                    }

                })
                .catch(error => {
                    // handle any errors that occurred during the request
                    console.error("No match result ...", error);
                });
            
        
            
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

getCarInfo();
