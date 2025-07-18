# API Design Specification (v1)

This document outlines the design for the RESTful API that will power the application. The design adheres to the following core principles:
-   **Resource-Oriented**: Endpoints are structured around resources (e.g., `facilities`, `users`).
-   **Consistent Naming**: Paths are lowercase and hyphenated (e.g., `/plan-activities`).
-   **Correct HTTP Methods**: Methods reflect the action being performed (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
-   **Proper Status Codes**: Standard HTTP status codes are used to indicate the outcome of an API call.
-   **Clear Schemas**: Request and response bodies are clearly defined.
-   **Scalable Lists**: Endpoints that return lists support pagination, filtering, and sorting.
-   **Versioning**: The API is versioned in the path (`/api/v1/...`) to allow for future iterations without breaking existing clients.

---

## 1. Provinces Resource

Handles operations related to geographical provinces.

### 1.1. `GET /api/v1/provinces`

-   **Description**: Retrieves a list of all provinces.
-   **Query Parameters**:
    -   `sort_by` (string, optional): Field to sort by. Defaults to `name`.
    -   `order` (string, optional): Sort order. `asc` or `desc`. Defaults to `asc`.
-   **Successful Response (200 OK)**:
    ```json
    {
      "data": [
        {
          "id": 1,
          "name": "eastern"
        },
        {
          "id": 4,
          "name": "kigali"
        },
        {
          "id": 2,
          "name": "northern"
        }
      ]
    }
    ```

### 1.2. `GET /api/v1/provinces/{provinceId}`

-   **Description**: Retrieves a single province by its ID.
-   **Successful Response (200 OK)**:
    ```json
    {
      "data": {
        "id": 4,
        "name": "kigali"
      }
    }
    ```
-   **Error Responses**:
    -   `404 Not Found`: If no province with the given ID exists.

---

## 2. Districts Resource

Handles operations related to geographical districts.

### 2.1. `GET /api/v1/districts`

-   **Description**: Retrieves a list of districts.
-   **Query Parameters**:
    -   `province_id` (integer, optional): Filters districts by the specified province ID.
    -   `sort_by` (string, optional): Field to sort by. Defaults to `name`.
    -   `order` (string, optional): Sort order. `asc` or `desc`. Defaults to `asc`.
-   **Successful Response (200 OK)**:
    ```json
    {
      "data": [
        {
          "id": 1,
          "name": "burera",
          "province_id": 2
        },
        {
          "id": 8,
          "name": "gasabo",
          "province_id": 4
        },
        {
          "id": 2,
          "name": "gicumbi",
          "province_id": 2
        }
      ]
    }
    ```

### 2.2. `GET /api/v1/districts/{districtId}`

-   **Description**: Retrieves a single district by its ID.
-   **Successful Response (200 OK)**:
    ```json
    {
      "data": {
        "id": 8,
        "name": "gasabo",
        "province_id": 4
      }
    }
    ```
-   **Error Responses**:
    -   `404 Not Found`: If no district with the given ID exists.

---

## 3. Facilities Resource

Handles operations related to facilities (hospitals and health centers).

### 3.1. `GET /api/v1/facilities`

-   **Description**: Retrieves a list of facilities.
-   **Query Parameters**:
    -   `district_id` (integer, optional): Filters facilities by the specified district ID.
    -   `facility_type` (string, optional): Filters facilities by type (`hospital` or `health_center`).
    -   `sort_by` (string, optional): Field to sort by. Defaults to `name`.
    -   `order` (string, optional): Sort order. `asc` or `desc`. Defaults to `asc`.
    -   `page` (integer, optional): Page number for pagination. Defaults to `1`.
    -   `limit` (integer, optional): Number of items per page. Defaults to `20`.
-   **Successful Response (200 OK)**:
    ```json
    {
      "data": [
        {
          "id": 1,
          "name": "butaro",
          "facility_type": "hospital",
          "district_id": 1
        },
        {
          "id": 10,
          "name": "kivuye",
          "facility_type": "health_center",
          "district_id": 1
        }
      ],
      "pagination": {
        "total_items": 53,
        "total_pages": 3,
        "current_page": 1,
        "limit": 20
      }
    }
    ```

### 3.2. `GET /api/v1/facilities/{facilityId}`

-   **Description**: Retrieves a single facility by its ID.
-   **Successful Response (200 OK)**:
    ```json
    {
      "data": {
        "id": 1,
        "name": "butaro",
        "facility_type": "hospital",
        "district_id": 1,
        "district": {
          "id": 1,
          "name": "burera",
          "province_id": 2
        },
        "province": {
          "id": 2,
          "name": "northern"
        }
      }
    }
    ```
-   **Note**: The response for a single facility should be rich, including nested data for its district and province for client convenience.
-   **Error Responses**:
    -   `404 Not Found`: If no facility with the given ID exists.

---

## 4. Users & Authentication Resource

Handles user management and authentication. Access to most of these endpoints will be restricted based on user role (e.g., only admins can list all users).

### 4.1. `POST /api/v1/users/register`

-   **Description**: Registers a new user. This is a public endpoint.
-   **Request Body**:
    ```json
    {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "password": "a-very-strong-password",
      "facility_id": 1 
    }
    ```
-   **Successful Response (201 Created)**:
    ```json
    {
      "data": {
        "id": 123,
        "name": "John Doe",
        "email": "john.doe@example.com",
        "role": "user",
        "facility_id": 1
      },
      "message": "User registered successfully."
    }
    ```
-   **Error Responses**:
    -   `400 Bad Request`: If the request body is invalid (e.g., missing fields, weak password).
    -   `409 Conflict`: If a user with the given email already exists.

### 4.2. `POST /api/v1/users/login`

-   **Description**: Authenticates a user and returns a token.
-   **Request Body**:
    ```json
    {
      "email": "john.doe@example.com",
      "password": "a-very-strong-password"
    }
    ```
-   **Successful Response (200 OK)**:
    ```json
    {
      "token": "a.secure.jwt.token",
      "user": {
        "id": 123,
        "name": "John Doe",
        "role": "user"
      }
    }
    ```
-   **Error Responses**:
    -   `401 Unauthorized`: If the credentials are invalid.

### 4.3. `GET /api/v1/users`

-   **Description**: Retrieves a list of all users. (Admin access required).
-   **Query Parameters**:
    -   `role` (string, optional): Filters users by role.
    -   `facility_id` (integer, optional): Filters users by facility.
    -   `page`, `limit`, `sort_by`, `order`
-   **Successful Response (200 OK)**:
    -   Similar to other list endpoints, with pagination.

### 4.4. `GET /api/v1/users/{userId}`

-   **Description**: Retrieves a single user by their ID. (Admin or the user themselves).
-   **Successful Response (200 OK)**:
    ```json
    {
      "data": {
        "id": 123,
        "name": "John Doe",
        "email": "john.doe@example.com",
        "role": "user",
        "facility_id": 1,
        "facility": {
            "id": 1,
            "name": "butaro"
        }
      }
    }
    ```
-   **Error Responses**:
    -   `403 Forbidden`: If the requesting user is not authorized to view the resource.
    -   `404 Not Found`.

### 4.5. `PATCH /api/v1/users/{userId}`

-   **Description**: Updates a user's information. (Admin or the user themselves).
-   **Request Body**:
    ```json
    {
      "name": "John A. Doe",
      "facility_id": 2
    }
    ```
-   **Successful Response (200 OK)**:
    -   Returns the updated user object.
-   **Error Responses**:
    -   `400 Bad Request`, `403 Forbidden`, `404 Not Found`.

---

## 5. Plan Activities Resource

Handles the creation and management of annual plan activities for facilities.

### 5.1. `POST /api/v1/plan-activities`

-   **Description**: Creates a new set of plan activities for a facility for a specific fiscal year. This endpoint would likely expect a full list of activities for the facility type and save them in a single transaction.
-   **Request Body**:
    ```json
    {
      "facility_id": 1,
      "fiscal_year": "2024-2025",
      "project": "HIV NSP BUDGET SUPPORT",
      "activities": [
        {
          "activity_category": "Human Resources (HR)",
          "type_of_activity": "DH Medical Dr. Salary",
          "activity_description": "Provide salaries for health facilities staff (DHs, HCs)",
          "frequency": 12,
          "unit_cost": 5000.00,
          "count_q1": 1,
          "count_q2": 1,
          "count_q3": 1,
          "count_q4": 1,
          "comment": "Full time position"
        },
        {
            "activity_category": "Travel Related Costs (TRC)",
            "type_of_activity": "Supervision (All)",
            "activity_description": "Conduct integrated clinical mentorship",
            "frequency": 4,
            "unit_cost": 200.00,
            "count_q1": 1,
            "count_q2": 1,
            "count_q3": 1,
            "count_q4": 1
        }
      ]
    }
    ```
-   **Successful Response (201 Created)**:
    ```json
    {
      "data": {
        "message": "Plan activities for facility 1 for fiscal year 2024-2025 created successfully."
      }
    }
    ```
-   **Error Responses**:
    -   `400 Bad Request`: Invalid data, or if a plan for that facility and year already exists.
    -   `403 Forbidden`: User does not have permission to create a plan for this facility.

### 5.2. `GET /api/v1/plan-activities`

-   **Description**: Retrieves a list of plan activities.
-   **Query Parameters**:
    -   `facility_id` (integer, required): Filter by a specific facility.
    -   `fiscal_year` (string, required): Filter by a specific fiscal year.
    -   `project` (string, optional): Filter by project.
-   **Successful Response (200 OK)**:
    -   Returns a list of activity objects similar to the structure in the `POST` request.
    ```json
    {
      "data": [
        {
          "id": 101,
          "activity_category": "Human Resources (HR)",
          "type_of_activity": "DH Medical Dr. Salary",
          // ... all other fields ...
          "amount_q1": "5000.00",
          "total_budget": "60000.00"
        }
      ]
    }
    ```
-   **Error Responses**:
    -   `404 Not Found`: If no plan exists for the given criteria.

### 5.3. `PUT /api/v1/plan-activities`

-   **Description**: Updates a full set of plan activities for a facility for a specific fiscal year. This is a full replacement (PUT) of the existing plan data.
-   **Request Body**: Same as the `POST` request.
-   **Successful Response (200 OK)**:
    -   Returns a success message.
-   **Error Responses**:
    -   `400 Bad Request`, `403 Forbidden`, `404 Not Found`.

---

## 6. Execution Reports Resource

Handles the submission and retrieval of quarterly execution reports.

### 6.1. `POST /api/v1/execution-reports`

-   **Description**: Creates a new execution report for a facility for a specific reporting period.
-   **Request Body**:
    ```json
    {
      "facility_id": 1,
      "fiscal_year": "2024-2025",
      "reporting_period": "JULY - SEPTEMBER / 2024",
      "project": "HIV NSP BUDGET SUPPORT",
      "report_data": [
        {
          "activity_category": "A. Receipts",
          "type_of_activity": "Other Incomes",
          "activity_description": "Initial funding received.",
          "q1_amount": 15000.00,
          "q2_amount": 0.00,
          "q3_amount": 0.00,
          "q4_amount": 0.00,
          "cumulative_balance": 15000.00,
          "comments": "Some notes here."
        },
        {
          "activity_category": "B. Expenditures",
          "type_of_activity": "01. Human Resources + BONUS",
          "activity_description": "Salaries for staff.",
          "q1_amount": 7500.00,
          "q2_amount": 0.00,
          "q3_amount": 0.00,
          "q4_amount": 0.00,
          "cumulative_balance": 7500.00,
          "comments": null
        }
      ]
    }
    ```
-   **Note**: The API expects an array of all line items for the report. The backend will iterate through this array and create a corresponding record for each item in the `execution_reports` table.
-   **Successful Response (201 Created)**:
    ```json
    {
      "data": {
        "message": "Execution report for facility 1 for period JULY - SEPTEMBER / 2024 created successfully."
      }
    }
    ```
-   **Error Responses**:
    -   `400 Bad Request`, `403 Forbidden`.

### 6.2. `GET /api/v1/execution-reports`

-   **Description**: Retrieves the line items for an execution report.
-   **Query Parameters**:
    -   `facility_id` (integer, required): Filter by facility.
    -   `fiscal_year` (string, required): Filter by fiscal year.
    -   `reporting_period` (string, required): Filter by specific reporting period.
    -   `project` (string, optional): Filter by project.
-   **Successful Response (200 OK)**:
    ```json
    {
        "data": [
            {
                "id": 201,
                "activity_category": "A. Receipts",
                "type_of_activity": "Other Incomes",
                "activity_description": "Initial funding received.",
                "q1_amount": "15000.00",
                "q2_amount": "0.00",
                "q3_amount": "0.00",
                "q4_amount": "0.00",
                "cumulative_balance": "15000.00",
                "comments": "Some notes here."
            }
        ]
    }
    ```
-   **Error Responses**:
    -   `404 Not Found`.

### 6.3. `PUT /api/v1/execution-reports`

-   **Description**: Updates a full execution report for a specific period. This is a full replacement (PUT) of the existing report data.
-   **Request Body**:
    ```json
    {
      "facility_id": 1,
      "fiscal_year": "2024-2025",
      "reporting_period": "JULY - SEPTEMBER / 2024",
      "project": "HIV NSP BUDGET SUPPORT",
      "report_data": [
        {
          "activity_category": "A. Receipts",
          "type_of_activity": "Other Incomes",
          "activity_description": "Updated funding information.",
          "q1_amount": 16000.00,
          "q2_amount": 0.00,
          "q3_amount": 0.00,
          "q4_amount": 0.00,
          "cumulative_balance": 16000.00,
          "comments": "Adjustment made."
        }
      ]
    }
    ```
-   **Successful Response (200 OK)**:
    ```json
    {
      "data": {
        "message": "Execution report for facility 1 for period JULY - SEPTEMBER / 2024 updated successfully."
      }
    }
    ```
-   **Error Responses**:
    -   `400 Bad Request`, `403 Forbidden`, `404 Not Found`.

--- 