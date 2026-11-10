import pytest
from fastapi.testclient import TestClient

import src.app as app_module


@pytest.fixture

def client(monkeypatch):
    # Arrange
    monkeypatch.setattr(
        app_module,
        "activities",
        {
            "Chess Club": {
                "description": "Learn chess",
                "schedule": "Fridays",
                "max_participants": 3,
                "participants": ["alex@mergington.edu"],
            }
        },
    )
    return TestClient(app_module.app)


def test_get_activities_returns_activity_data(client):
    # Arrange
    expected_participants = ["alex@mergington.edu"]

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    assert response.json()["Chess Club"]["participants"] == expected_participants


def test_signup_adds_participant(client):
    # Arrange
    email = "sam@mergington.edu"

    # Act
    response = client.post("/activities/Chess Club/signup", params={"email": email})

    # Assert
    assert response.status_code == 200
    assert response.json()["message"] == f"Signed up {email} for Chess Club"
    assert email in client.get("/activities").json()["Chess Club"]["participants"]


def test_signup_rejects_duplicate_participant(client):
    # Arrange
    email = "alex@mergington.edu"

    # Act
    response = client.post("/activities/Chess Club/signup", params={"email": email})

    # Assert
    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up"
    assert client.get("/activities").json()["Chess Club"]["participants"].count(email) == 1


def test_signup_rejects_unknown_activity(client):
    # Arrange
    email = "sam@mergington.edu"

    # Act
    response = client.post("/activities/Unknown Club/signup", params={"email": email})

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_delete_removes_participant(client):
    # Arrange
    email = "alex@mergington.edu"

    # Act
    response = client.delete("/activities/Chess Club/signup", params={"email": email})

    # Assert
    assert response.status_code == 200
    assert response.json()["message"] == f"Removed {email} from Chess Club"
    assert email not in client.get("/activities").json()["Chess Club"]["participants"]


def test_delete_rejects_unregistered_participant(client):
    # Arrange
    email = "sam@mergington.edu"

    # Act
    response = client.delete("/activities/Chess Club/signup", params={"email": email})

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Student is not signed up"


def test_delete_rejects_unknown_activity(client):
    # Arrange
    email = "sam@mergington.edu"

    # Act
    response = client.delete("/activities/Unknown Club/signup", params={"email": email})

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"
