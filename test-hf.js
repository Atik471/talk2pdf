const testHF = async () => {
    try {
        const response = await fetch(
            "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2",
            {
                method: "POST",
                body: JSON.stringify({ inputs: "Hello world", options: { wait_for_model: true } }),
            }
        );
        console.log("OLD", response.status);
    } catch (e) { }

    try {
        const response2 = await fetch(
            "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2",
            {
                method: "POST",
                body: JSON.stringify({ inputs: "Hello world", options: { wait_for_model: true } }),
            }
        );
        console.log("NEW1", response2.status);
    } catch (e) { }

    try {
        const response3 = await fetch(
            "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2",
            {
                method: "POST",
                body: JSON.stringify({ inputs: "Hello world", options: { wait_for_model: true } }),
            }
        );
        console.log("NEW2", response3.status);
    } catch (e) { }
}

testHF();
