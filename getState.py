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

all_state_xpath = '//*[@id="gatsby-focus-wrapper"]/div[1]/div[9]/div[1]/div/div[2]/div[2]/ul/li/a'
all_state_list = driver.find_elements(By.XPATH, all_state_xpath)

state_title_list = []
state_link_list = []

for state in all_state_list:
    state_title = state.text
    state_title_list.append(state_title)
    state_link = state.get_attribute('href')
    state_link_list.append(state_link)
    print("Title > ", state_title)

for i in range(len(state_link_list)):
    state_url = state_link_list[i]
    driver.get(state_url)
    cities = driver.find_elements(By.XPATH, '//*[@id="gatsby-focus-wrapper"]/div[1]/div[8]/div[1]/div/div[2]/div[2]/ul/li/a')
    for city in cities:
        city_name = city.get_attribute('aria-label')
        city_link = city.get_attribute('href')

        with open('sixtcities.csv', mode='a', newline='') as file:
            writer = csv.writer(file)
            print(state_title_list[i])
            print(city_name)
            print(city_link)
            print("---------------------------------------")
            writer.writerow([state_title_list[i], city_name, city_link])
            # for state in all_state_list:
            #     state_title = state.text
            #     state_link = state.get_attribute('href')
            #     print("Title > ", state_title)
            #     writer.writerow([state_title, state_link])
time.sleep(1)

driver.close()    