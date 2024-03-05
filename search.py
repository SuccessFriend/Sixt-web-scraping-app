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
driver.get('https://www.sixt.com/')

time.sleep(2)

# Get the size of the web page
page_size = driver.execute_script("return { width: window.innerWidth, height: window.innerHeight }")

# Calculate the center point coordinates
center_x = page_size['width'] // 2 + 200
center_y = page_size['height'] // 2 + 140

# Use ActionChains to move to the center point and click
actions = ActionChains(driver)
actions.move_by_offset(center_x, center_y).click().perform()

# try:
#     modal_btn = driver.find_element(By.XPATH, '/html/body/div[2]//div/div/div[2]/div/div[2]/div/div[2]/div/div/div/button[2]')
#     print(modal_btn.text)
#     modal_btn.click()
# except:
#     print("No modal!")

pickup_location_box = driver.find_element(By.NAME, 'pickupLocation')
pickup_location_box.click()
pickup_location_box.send_keys("Albuquerque")

time.sleep(10)

pickup_location = driver.find_element(By.XPATH, '/html/body/div[1]/div[1]/div[1]/div[2]/div[1]/div/div/div[2]/div[2]/div/div/div[2]/div/form/div[3]/div/div/div/div[1]/div/div[2]/div')
pickup_location.click()

time.sleep(5)

pickup_date_box = driver.find_element(By.XPATH, '/html/body/div[1]/div[1]/div[1]/div[2]/div[1]/div/div/div[2]/div[2]/div/div/div[2]/div/form/div[1]/div[2]/div[1]/div[1]/div/div[2]/button[1]/div[2]')
pickup_date_box.click()
pickup_date_box.send_keys("May 01")

time.sleep(5)

return_date_box = driver.find_element(By.XPATH, '/html/body/div[1]/div[1]/div[1]/div[2]/div[1]/div/div/div[2]/div[2]/div/div/div[2]/div/form/div[1]/div[2]/div[1]/div[2]/div/div[2]/button[1]/div[2]')
return_date_box.click()
return_date_box.send_keys("Apr 30")

time.sleep(5)

search_btn = driver.find_element(By.XPATH, '/html/body/div[1]/div[1]/div[1]/div[2]/div[1]/div/div/div[2]/div[2]/div/div/div[2]/div/form/div[1]/div[2]/div[2]/div/button')
search_btn.click()

time.sleep(10)


time.sleep(1)

# driver.close()