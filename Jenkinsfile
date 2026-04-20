pipeline {
    agent any

    environment {
        PYTHON = 'C:\\Users\\DELL\\AppData\\Local\\Programs\\Python\\Python313\\python.exe'
    }

    stages {

        stage('Setup Environment') {
            steps {
                bat '"%PYTHON%" -m venv venv'
                bat 'venv\\Scripts\\python.exe -m pip install --upgrade pip --quiet'
                bat 'venv\\Scripts\\python.exe -m pip install fastapi uvicorn pydantic pytest pytest-cov httpx --quiet'
            }
        }

        stage('Run Tests') {
            steps {
                bat 'venv\\Scripts\\python.exe -m pytest tests/ --cov=app --cov-report=xml --cov-report=term -v --junitxml=test-results/results.xml'
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'test-results/results.xml'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                bat 'docker build -t eco-metric-api:latest .'
            }
        }

        stage('Run Container (Staging)') {
            steps {
                bat 'docker stop eco-metric-staging 2>nul || echo done'
                bat 'docker rm eco-metric-staging 2>nul || echo done'
                bat 'docker run -d -p 8001:8000 --name eco-metric-staging eco-metric-api:latest'
            }
        }
    }

    post {
        success {
            echo 'DONE — app running on http://localhost:8001/docs'
        }
        failure {
            echo 'Pipeline failed — check logs above.'
        }
    }
}