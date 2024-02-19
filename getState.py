import csv
import threading

from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver import ActionChains
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service
import undetected_chromedriver as uc
import pandas as pd
import time
import re
from datetime import datetime
from datetime import date
from seleniumbase import Driver

# driver = Driver(uc=True)
# Create Chrome options with incognito mode
chrome_options = Options()
chrome_options.add_argument('--incognito')

# Initialize the webdriver with Chrome and the specified options
driver = webdriver.Chrome(options=chrome_options)
driver.get('https://www.sixt.com/car-rental/usa/')

time.sleep(6)

try:
    modal_btn = driver.find_element(By.XPATH, '/html/body/div[2]//div/div/div[2]/div/div[2]/div/div[2]/div/div/div/button[2]')
    print(modal_btn.text)
    modal_btn.click()
except:
    print("No modal!")

# # Scroll down using JavaScript
# driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")

all_location_xpath = '//*[@id="gatsby-focus-wrapper"]/div[1]/div[9]/div[1]/div/div[2]/div[2]/ul/li/a'
all_location_list = driver.find_elements(By.XPATH, all_location_xpath)

with open('sixtLocation.csv', mode='a', newline='') as file:
    writer = csv.writer(file)
    for location in all_location_list:
        location_title = location.text
        location_link = location.get_attribute('href')
        print("Title > ", location_title)
        writer.writerow([location_title, location_link])
time.sleep(1)

# all_location_list = driver.find_elements(By.XPATH, '//*[@id="gatsby-focus-wrapper"]/div[1]/div[9]/div[1]/div/div[2]/div[2]/ul/li/a')
# for location in all_location_list:
#     location_text = location.text
#     location_link = location.get_attribute('href')
#     print(">>> ", location_text, location_link)

# children = stateElement.find_elements(By.XPATH, './li')
# with open('state.csv', mode='w', newline='') as file:
#     writer = csv.writer(file)
#     # writer.writerow(["stateName", "stateHref"])
#     for c in range(0, len(children)):
#         stateName = children[c].find_element(By.XPATH, './a').get_attribute("innerHTML")
#         stateHref = children[c].find_element(By.XPATH, './a').get_attribute("href")
#         print(stateName)
#         print(stateHref)
#         writer.writerow([stateName, stateHref])

driver.close()    