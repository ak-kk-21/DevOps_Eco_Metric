pipeline {
    agent any

    environment {
        PYTHON = 'C:\\Users\\DELL\\AppData\\Local\\Programs\\Python\\Python313\\python.exe'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Setup Python') {
            steps {
                bat '"%PYTHON%" -m venv venv'
                bat 'venv\\Scripts\\python.exe -m pip install --upgrade pip --quiet'
                bat 'venv\\Scripts\\python.exe -m pip install -r requirements.txt --quiet'
            }
        }

        stage('Run Tests') {
            steps {
                bat 'venv\\Scripts\\python.exe -m pytest tests --cov=app --cov-report=xml --junitxml=test-results/results.xml -v'
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'test-results/results.xml'
                }
            }
        }

        stage('Build Backend Image') {
            steps {
                bat 'docker build -t eco-metric-api:latest .'
            }
        }

        stage('Run Backend Container') {
            steps {
                bat 'docker stop eco-metric 2>nul || echo done'
                bat 'docker rm eco-metric 2>nul || echo done'
                bat 'docker run -d -p 8001:8000 --name eco-metric eco-metric-api:latest'
            }
        }

        stage('Build Frontend Image') {
            steps {
                bat 'docker build -t eco-metric-frontend:latest ./frontend'
            }
        }

        stage('Run Frontend Container') {
            steps {
                bat 'docker stop eco-frontend 2>nul || echo done'
                bat 'docker rm eco-frontend 2>nul || echo done'
                bat 'docker run -d -p 3000:80 --name eco-frontend eco-metric-frontend:latest'
            }
        }
    }

    post {
        success {
            echo 'SUCCESS — Backend: http://localhost:8001/docs | Frontend: http://localhost:3000'
        }
        failure {
            echo 'FAILED — check logs above'
        }
    }
}