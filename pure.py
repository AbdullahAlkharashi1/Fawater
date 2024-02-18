import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import NoSuchElementException, TimeoutException
import datetime
import requests
import re

# Define the website URL and path to Chromedriver
website = 'https://www.se.com.sa/ar-SA/login'
path = '/Users/abdullah/Downloads/chromedriver'

# Create a Chrome WebDriver instance
driver = webdriver.Chrome(executable_path=path)

# Navigate to the website
driver.get(website)

# Wait for the username input field to be visible
wait = WebDriverWait(driver, 80)  # Adjust the timeout (10 seconds) as needed

# Wait for the "fawater" button to become clickable
fawater_button = wait.until(EC.element_to_be_clickable((By.XPATH, '/html/body/app-root/app-layout/div/sc-placeholder[1]/app-service-header/header/div/div/div/nav[1]/ul/li[3]/a')))
fawater_button.click()

# Wait for the spinner overlay to disappear
spinner_overlay = wait.until_not(EC.presence_of_element_located((By.CLASS_NAME, 'ngx-spinner-overlay')))

# Wait for the table to be visible (adjust the XPath as needed)
table = wait.until(EC.visibility_of_element_located((By.XPATH, '/html/body/app-root/app-layout/div/sc-placeholder[2]/app-bill-details/section/app-contract-account-details/main/div/section[3]/div/app-bill-history/div/div/table')))
stop = WebDriverWait(driver, 25)
# Define a flag to check if there are more data to load
more_data_to_load = True

while more_data_to_load:
    try:
        # Wait for the "Load More" button
        load_more_button = stop.until(EC.presence_of_element_located((By.XPATH, '/html/body/app-root/app-layout/div/sc-placeholder[2]/app-bill-details/section/app-contract-account-details/main/div/section[3]/div/app-bill-history/div/div/div[2]/button')))
        
        # Click the "Load More" button
        load_more_button.click()

        # Wait for the table to update with new data
        WebDriverWait(driver, 40).until(EC.presence_of_element_located((By.XPATH, '/html/body/app-root/app-layout/div/sc-placeholder[2]/app-bill-details/section/app-contract-account-details/main/div/section[3]/div/app-bill-history/div/div/table/tbody/tr[not(contains(@class, "ngx-spinner"))]')))
        
        # Update the table element reference
        table = wait.until(EC.visibility_of_element_located((By.XPATH, '/html/body/app-root/app-layout/div/sc-placeholder[2]/app-bill-details/section/app-contract-account-details/main/div/section[3]/div/app-bill-history/div/div/table')))
    except (TimeoutException, NoSuchElementException):
        more_data_to_load = False

# Extract and print the table data
table_data = []
rows = table.find_elements(By.XPATH, './/tbody/tr')
for row in rows:
    row_data = [cell.text for cell in row.find_elements(By.XPATH, './/td')]
    table_data.append(row_data)

# Print the table data
for row_data in table_data:
    print('\t'.join(row_data))
##
    user_id = os.getenv('USER_ID')
# Process the table data
riyals_and_months_data = []
rows = table.find_elements(By.XPATH, './/tbody/tr')
for row in rows:
    cell_data = row.find_elements(By.XPATH, './/td')
    if len(cell_data) >= 5:
        month_value = cell_data[1].text
        riyals_value = cell_data[4].text
        # Remove non-numeric characters from riyals_value and handle potential trailing dots
        riyals_value = re.sub(r'[^\d.]+', '', riyals_value).rstrip('.')
        riyals_value = float(riyals_value)
        # Convert month to datetime
        date_str = month_value.replace(',', '')  # Remove comma if present
        date_obj = datetime.datetime.strptime(date_str, '%d %b %Y')
        riyals_and_months_data.append((date_obj, riyals_value))

# Data Transformation
transformed_data = [{
    'year': date.year,
    'month': date.month,
    'billPrice': bill_price ,
    'userId': user_id 
} for date, bill_price in riyals_and_months_data]

# Print transformed data for verification
print("Transformed Data:")
for item in transformed_data:
    print(item)
# Sending Data to API
api_url = "http://localhost:3000/api/uploadElecData"
response = requests.post(api_url, json=transformed_data)

if response.status_code == 200:
    print("Data successfully sent to the server.")
else:
    print(f"Failed to send data. Status code: {response.status_code}, Response: {response.text}")

# Closing the browser
driver.quit()


    