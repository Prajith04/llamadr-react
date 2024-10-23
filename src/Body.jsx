import React, { useState } from 'react';

function Body() {
    const [symptoms, setSymptoms] = useState('');
    const [submittedSymptoms, setSubmittedSymptoms] = useState([]);

    const handleSubmit = (event) => {
        event.preventDefault();
        setSubmittedSymptoms(symptoms.split(',').map(symptom => symptom.trim()));
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <label htmlFor="symptom">Enter your symptoms:</label>
                <input 
                    type="text" 
                    id="symptom" 
                    name="symptom" 
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    required
                />
                <button type="submit">Submit</button>
            </form>
            <div>
                {submittedSymptoms.length > 0 && (
                    <ul>
                        {submittedSymptoms.map((symptom, index) => (
                            <li key={index}>{symptom}</li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default Body;