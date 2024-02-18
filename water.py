import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import NoSuchElementException, TimeoutException
import time 
import datetime
import json
import requests
import argparse

# Define the website URL and path to Chromedriver
website = 'https://ebranch.nwc.com.sa/Arabic/Pages/Login.aspx'
path = '/Users/abdullah/Downloads/chromedriver'

# Create a Chrome WebDriver instance
driver = webdriver.Chrome(executable_path=path)

# Navigate to the website
driver.get(website)

# Wait for the user to manually log in and for the "fawater_button" to become clickable
wait = WebDriverWait(driver, 300)  # Adjust the timeout (300 seconds) as needed
fawater_button = wait.until(EC.element_to_be_clickable((By.XPATH, '/html/body/form/div[4]/div/div[5]/div[7]/span/div[1]/div[2]/div/div[2]/div/div/div[1]/div/div[2]/div[2]/div[1]/div')))
fawater_button.click()


# Wait for the spinner overlay to disappear
spinner_overlay = wait.until_not(EC.presence_of_element_located((By.CLASS_NAME, 'ngx-spinner-overlay')))

# Assuming you have a list of XPaths like the ones you provided
element_data_list = []

# Define the base XPath pattern for the first set of elements
base_xpath_1 = '/html/body/form/div[4]/div/div[5]/div[7]/span/div[1]/div[2]/div/div/div/div/div[1]/div[1]/div[2]/div[2]/div[4]/div[3]/div[{index}]/a/span[2]/span'

# Define the base XPath pattern for the second set of elements
base_xpath_2 = '//*[@id="ctl00_ctl47_g_e22d744b_2540_415f_8d76_849c57826c13_ctl00_pnlTransactionList"]/div[{index}]/a/div/div/span[2]'

# Loop through indices 1 to 13 (or any desired range) for both sets of elements
# Loop through indices 1 to 13 for the first page
for i in range(1, 13):
    xpath_1 = base_xpath_1.format(index=i)
    xpath_2 = base_xpath_2.format(index=i)
     
    element_1 = wait.until(EC.visibility_of_element_located((By.XPATH, xpath_1)))
    element_2 = wait.until(EC.visibility_of_element_located((By.XPATH, xpath_2))) 
    element_data_list.append((element_1.text, element_2.text))

# JavaScript code to be executed
js_click_code = """
var link = document.getElementById('ctl00_ctl47_g_e22d744b_2540_415f_8d76_849c57826c13_ctl00_BillsPagingControl_rptPaging_ctl01_lbPaging');
link.click();
"""
driver.execute_script(js_click_code)

# Add wait time here, between page 1 and page 2 extractions
time.sleep(5)  # Wait for 5 seconds for the second page to load

# Loop through indices 1 to 13 for the second page
for i in range(1, 13):
    xpath_1 = base_xpath_1.format(index=i)
    xpath_2 = base_xpath_2.format(index=i)

    element_1 = wait.until(EC.visibility_of_element_located((By.XPATH, xpath_1)))
    element_2 = wait.until(EC.visibility_of_element_located((By.XPATH, xpath_2)))
    element_data_list.append((element_1.text, element_2.text))

# Print collected data

    collected_data = element_data_list  # Replace with actual scraped data

user_id = os.getenv('USER_ID')

# Data Transformation
transformed_data = []
for bill_price, date_str in collected_data:
    date = datetime.datetime.strptime(date_str, '%Y-%m-%d')
    data_entry = {
        'year': date.year,
        'month': date.month,
        'billPrice': float(bill_price),
        'userId': user_id 

    }
    transformed_data.append(data_entry)

# Print transformed data for verification

# URL of your Express.js API endpoint
api_url = "http://localhost:3000/api/uploadWaterData"

# Send a POST request with the JSON data
response = requests.post(api_url, json=transformed_data)

if response.status_code == 200:
    print("Data successfully sent to the server.")
else:
    print(f"Failed to send data. Status code: {response.status_code}")