import https from 'https';

const options = {
    hostname: 'openrouter.ai',
    path: '/api/v1/models',
    method: 'GET',
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        const models = JSON.parse(data).data;
        const freeModels = models.filter((m: any) => m.pricing.prompt === "0" && m.id.endsWith(":free"));
        console.log("Free Models: ", freeModels.slice(0, 10).map((m: any) => m.id));
    });
});

req.on('error', (error) => console.error(error));
req.end();
