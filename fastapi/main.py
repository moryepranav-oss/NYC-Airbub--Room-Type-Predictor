from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

COLUMNS = [
    "host_name",
    "latitude",
    "longitude",
    "price",
    "minimum_nights",
    "number_of_reviews",
    "reviews_per_month",
    "calculated_host_listings_count",
    "availability_365",
    "neighbourhood_group",
    "neighbourhood",
]

MODEL_PATH = Path(__file__).with_name("model_pipline.pkl")
model = joblib.load(MODEL_PATH)


class Features(BaseModel):
    host_name: str | None = Field(
        default=None, description="Host name (optional; omitted values use model imputation)"
    )
    latitude: float = Field(..., ge=-90, le=90, description="Latitude coordinate")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude coordinate")
    price: float = Field(..., gt=0, description="Price per night, must be positive")
    minimum_nights: int = Field(..., ge=1, le=365, description="Minimum nights required for booking")
    number_of_reviews: int = Field(..., ge=0, description="Total number of reviews")
    reviews_per_month: float = Field(..., ge=0, description="Average reviews per month")
    calculated_host_listings_count: int = Field(
        ..., ge=0, description="Number of listings by this host"
    )
    availability_365: int = Field(..., ge=0, le=365, description="Days available out of 365")
    neighbourhood_group: str = Field(..., min_length=1, description="Borough or neighbourhood group")
    neighbourhood: str = Field(..., min_length=1, description="Specific neighbourhood name")


@app.get("/")
def greet():
    return {"message": "Hello Guys", "prediction_endpoint": "/predict"}


@app.post("/predict")
def predict(features: Features):
    row = pd.DataFrame([features.model_dump()], columns=COLUMNS)
    prediction = model.predict(row)[0]
    probability = model.predict_proba(row)[0]

    return {
        "Predicted_room_type": str(prediction),
        "Probability": probability.tolist(),
    }
