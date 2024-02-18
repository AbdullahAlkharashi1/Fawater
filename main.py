import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor  # Import RandomForestRegressor
import json
import numpy as np
import sys

# Function to train Random Forest model
def train_random_forest_model(X, y):
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42)
    model = RandomForestRegressor()
    model.fit(X_train, y_train)
    return model


# Function to find similar houses and calculate averages
def calculate_similar_houses_averages(data, feature, value, initial_threshold=1, max_threshold=5, threshold_increment=1):
    filtered_houses = data[(data[feature] >= value - initial_threshold)
                           & (data[feature] <= value + initial_threshold)]

    # Expand the threshold until you find some data
    while filtered_houses.empty and initial_threshold <= max_threshold:
        initial_threshold += threshold_increment
        filtered_houses = data[(data[feature] >= value - initial_threshold)
                               & (data[feature] <= value + initial_threshold)]

    # If still no data found, take the extremes of your dataset
    if filtered_houses.empty:
        extreme_lower = data[data[feature] == data[feature].min()]
        extreme_upper = data[data[feature] == data[feature].max()]
        extremes = pd.concat([extreme_lower, extreme_upper])
        return extremes['water_bill'].mean(), extremes['electricity_bill'].mean()

    # If data found, calculate averages
    return filtered_houses['water_bill'].mean(), filtered_houses['electricity_bill'].mean()


def predict_random_forest_model(model, X):
    return model.predict([X])[0]

# Function to handle NaN values in the results
def handle_nan(val):
    if isinstance(val, float) and np.isnan(val):
        return None
    return val


if __name__ == "__main__":
    # Load your reshaped data
    data = pd.read_csv('Reshaped_Fawater_Consumption.csv')

    # Check if enough arguments are provided
    if len(sys.argv) != 6:
        print("Error: Incorrect number of arguments provided.")
        sys.exit(1)

    # Parse input arguments
    house_size = int(sys.argv[1])
    num_humans = int(sys.argv[2])
    num_rooms = int(sys.argv[3])
    num_bathrooms = int(sys.argv[4])
    current_month = int(sys.argv[5])

    # Create features matrix X and target vectors y
    X = data[['house_size', 'num_humans',
              'num_rooms', 'num_bathrooms', 'month']].values
    y_water = data['water_bill'].values
    y_electricity = data['electricity_bill'].values

    # Train models for water and electricity 
    model_water = train_random_forest_model(X, y_water)
    model_electricity = train_random_forest_model(X, y_electricity)

    # Calculate averages
    average_water_similar_houses_in_residents, average_electricity_similar_houses_in_residents = calculate_similar_houses_averages(
        data, 'num_humans', num_humans)
    average_water_similar_houses_size, average_electricity_similar_houses_size = calculate_similar_houses_averages(
        data, 'house_size', house_size)
    average_water_similar_houses_bathroom, average_electricity_similar_houses_bathroom = calculate_similar_houses_averages(
        data, 'num_bathrooms', num_bathrooms)

    # Predict total average water and electricity
    input_features = [house_size, num_humans,
                      num_rooms, num_bathrooms, current_month]
    total_average_water = predict_random_forest_model(
        model_water, input_features)
    total_average_electricity = predict_random_forest_model(
        model_electricity, input_features)

    # Results
    results = {
        "average_water_similar_houses_in_residents": handle_nan(average_water_similar_houses_in_residents),
        "average_electricity_similar_houses_in_residents": handle_nan(average_electricity_similar_houses_in_residents),
        "average_water_similar_houses_size": handle_nan(average_water_similar_houses_size),
        "average_electricity_similar_houses_size": handle_nan(average_electricity_similar_houses_size),
        "average_water_similar_houses_bathroom": handle_nan(average_water_similar_houses_bathroom),
        "average_electricity_similar_houses_bathroom": handle_nan(average_electricity_similar_houses_bathroom),
        "total_average_water": total_average_water,
        "total_average_electricity": total_average_electricity
    }

    # Serialize the results dictionary to JSON
    result_json = json.dumps(results, indent=4)
    print(result_json)
