from flask import Flask, request, jsonify, render_template
import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import classification_report, accuracy_score, mean_absolute_error

app = Flask(__name__)

# Load data
data_file = 'seattle-weather.csv'
data = pd.read_csv(data_file)

# Encode categorical columns
label_encoder_weather = LabelEncoder()
label_encoder_day_type = LabelEncoder()

data['weather'] = label_encoder_weather.fit_transform(data['weather'])
data['day_type'] = label_encoder_day_type.fit_transform(data['day_type'])

# Convert date to datetime and extract day of year
data['date'] = pd.to_datetime(data['date'])
data['day_of_year'] = data['date'].dt.dayofyear

# Prepare data for temperature prediction
X_temp = data[['day_of_year']]
y_temp_min = data['temp_min']
y_temp_max = data['temp_max']

# Split data for temperature prediction
X_temp_train, X_temp_test, y_temp_min_train, y_temp_min_test = train_test_split(
    X_temp, y_temp_min, test_size=0.2, random_state=42)
_, _, y_temp_max_train, y_temp_max_test = train_test_split(
    X_temp, y_temp_max, test_size=0.2, random_state=42)

# Train regressors for temp_min and temp_max
rf_regressor_min = RandomForestRegressor(n_estimators=100, random_state=42)
rf_regressor_max = RandomForestRegressor(n_estimators=100, random_state=42)

rf_regressor_min.fit(X_temp_train, y_temp_min_train)
rf_regressor_max.fit(X_temp_train, y_temp_max_train)

# Prepare data for weather prediction
y_weather = data['weather']

# Split data for weather prediction
X_weather_train, X_weather_test, y_weather_train, y_weather_test = train_test_split(
    X_temp, y_weather, test_size=0.2, random_state=42)

# Train classifier for weather prediction
rf_classifier_weather = RandomForestClassifier(n_estimators=100, random_state=42)
rf_classifier_weather.fit(X_weather_train, y_weather_train)

# Prepare data for day_type prediction
X_day_type = data[['temp_max', 'temp_min', 'weather']]
y_day_type = data['day_type']

# Split data for day_type prediction
X_train_day_type, X_test_day_type, y_train_day_type, y_test_day_type = train_test_split(
    X_day_type, y_day_type, test_size=0.2, random_state=42)

# Train classifier for day_type prediction
rf_classifier_day_type = RandomForestClassifier(n_estimators=100, random_state=42)
rf_classifier_day_type.fit(X_train_day_type, y_train_day_type)

# Predict day_type for the dataset
y_pred_day_type = rf_classifier_day_type.predict(X_test_day_type)


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()  # Get JSON data from the request body
    start_date = pd.to_datetime(data['start_date'])
    end_date = pd.to_datetime(data['end_date'])

    dates_range = pd.date_range(start=start_date, end=end_date)
    day_of_year_range = dates_range.dayofyear

    new_data_range = pd.DataFrame({'day_of_year': day_of_year_range})

    # Predict temp_min, temp_max, and weather for the range of dates
    new_temp_min_predictions = rf_regressor_min.predict(new_data_range)
    new_temp_max_predictions = rf_regressor_max.predict(new_data_range)
    new_weather_predictions = rf_classifier_weather.predict(new_data_range)

    predicted_weather_labels_range = label_encoder_weather.inverse_transform(new_weather_predictions)

    # Predict day_type for the range of dates
    new_data_day_type = pd.DataFrame({
        'temp_max': new_temp_max_predictions,
        'temp_min': new_temp_min_predictions,
        'weather': label_encoder_weather.transform(predicted_weather_labels_range)
    })

    new_day_type_predictions = rf_classifier_day_type.predict(new_data_day_type)
    predicted_day_types_range = label_encoder_day_type.inverse_transform(new_day_type_predictions)

    # Count working and non-working days
    working_days_count = (predicted_day_types_range == 'Working Day').sum()
    non_working_days_count = (predicted_day_types_range == 'Non-working Day').sum()

    # Prepare predictions data for each date in the range
    predictions_range = pd.DataFrame({
        'Date': dates_range,
        'Temp Min Predictions': new_temp_min_predictions,
        'Temp Max Predictions': new_temp_max_predictions,
        'Weather Predictions': predicted_weather_labels_range,
        'Day Type Predictions': predicted_day_types_range
    })

    # Create events for the calendar
    events = []
    for date, day_type, weather_prediction in zip(dates_range, predicted_day_types_range, predicted_weather_labels_range):
        event = {
            'start': date.strftime('%Y-%m-%d'),
        }

        if weather_prediction == 'rain':
            event['className'] = 'rain-style'
        elif weather_prediction == 'snow':
            event['className'] = 'snow-style'
        elif day_type == 'Working Day':
            event['className'] = 'working-day'
        else:
            event['className'] = 'cold-day'
        events.append(event)


    #*****TESTS******
    # Evaluate accuracy for temp_min and temp_max
    accuracy_temp_min = round((rf_regressor_min.score(X_temp_test, y_temp_min_test))*100, 2)
    accuracy_temp_max = round((rf_regressor_max.score(X_temp_test, y_temp_max_test))*100, 2)

    # Calculate MAE for temp_min and temp_max
    mae_temp_min = round(mean_absolute_error(y_temp_min_test, rf_regressor_min.predict(X_temp_test)), 2)
    mae_temp_max = round(mean_absolute_error(y_temp_max_test, rf_regressor_max.predict(X_temp_test)), 2)

    # Evaluate accuracy and generate classification report for weather
    accuracy_weather = round((accuracy_score(y_weather_test, rf_classifier_weather.predict(X_weather_test)))*100, 2)
    report_weather = classification_report(y_weather_test, rf_classifier_weather.predict(X_weather_test))

    # Evaluate accuracy and generate classification report for day_type
    accuracy_day_type = round((accuracy_score(y_test_day_type, y_pred_day_type))*100, 2)
    report_day_type = classification_report(y_test_day_type, y_pred_day_type)

    # Return all computed metrics and predictions as JSON response
    return jsonify({
        'accuracy_temp_min': accuracy_temp_min,
        'accuracy_temp_max': accuracy_temp_max,
        'mae_temp_min': mae_temp_min,
        'mae_temp_max': mae_temp_max,
        'accuracy_weather': accuracy_weather,
        'report_weather': report_weather,
        'accuracy_day_type': accuracy_day_type,
        'report_day_type': report_day_type,
        'working_days_count': int(working_days_count),
        'non_working_days_count': int(non_working_days_count),
        'events': events,
        'predictions': predictions_range.to_dict(orient='records')
    })


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)  # Change port to 5001
