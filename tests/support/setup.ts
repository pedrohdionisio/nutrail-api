import 'reflect-metadata';

process.env.TABLE_NAME = 'nutrail-test';
process.env.BUCKET_NAME = 'nutrail-files-test';
process.env.MEAL_QUEUE_URL = 'https://sqs.test/meal-processing';
process.env.COGNITO_USER_POOL_ID = 'us-east-1_test';
process.env.COGNITO_CLIENT_ID = 'test-client';
process.env.EMAIL_FROM = 'Nutrail <no-reply@nutrail.test>';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'test';
process.env.AWS_SECRET_ACCESS_KEY = 'test';
