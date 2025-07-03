import axios from 'axios';

async function testCloudflareEndpoint() {
    try {
        console.log('Testing Cloudflare DNS creation endpoint...\n');
        
        const testData = {
            domain: 'bodydawn.com',
            subdomain: 'test'
        };
        
        console.log('Making POST request to http://localhost:5000/api/cloudflare/dns/default');
        console.log('Request data:', testData);
        
        const response = await axios.post('http://localhost:5000/api/cloudflare/dns/default', testData);
        
        console.log('Response Status:', response.status);
        console.log('Response Headers:', response.headers);
        console.log('\nResponse Data:');
        console.log(JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Error Response Status:', error.response.status);
            console.error('Error Response Data:', error.response.data);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received:', error.message);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error setting up request:', error.message);
        }
    }
}

// Run the test
testCloudflareEndpoint();