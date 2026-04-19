pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'poetry install --no-interaction'
            }
        }

        stage('Run Tests') {
            steps {
                bat 'poetry run pytest tests/ --cov=app --cov-report=xml --cov-report=term -v'
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: '**/test-results/*.xml'
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
                bat '''
                    docker stop eco-metric-staging 2>nul || echo "No container to stop"
                    docker rm eco-metric-staging 2>nul || echo "No container to remove"
                    docker run -d -p 8001:8000 --name eco-metric-staging eco-metric-api:latest
                '''
            }
        }
    }

    post {
        success {
            echo 'Pipeline succeeded! App running on http://localhost:8001'
        }
        failure {
            echo 'Pipeline failed — check logs above.'
        }
    }
}