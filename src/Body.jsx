import React, { useState } from 'react';
import  { useEffect } from 'react';
import './Body.css';

function Body() {
    const api= import.meta.env.VITE_API_URL;
    const [symptoms, setSymptoms] = useState('');
    const [matchingSymptoms, setMatchingSymptoms] = useState([]);
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);
    const [diseases, setDiseases] = useState([]);
    const [singleDisease, setSingleDisease] = useState(null);
    const [llmResponse, setLlmResponse] = useState(''); // New state for LLM response
    const [userPrompt, setUserPrompt] = useState(''); // New state for user prompt
    useEffect(() => {
        const callTriggerReloadAPI = async () => {
          try {
            await fetch('https://prajith04-fastapi.hf.space/trigger-reload', {
              method: 'POST',
            }); // Replace with your trigger API endpoint
          } catch (error) {
            console.error('Error calling trigger reload API:', error);
          }
        };
    
        callTriggerReloadAPI(); // Call the API on component mount/reload
      }, []);
    // Handle individual symptom submission
    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const response = await fetch('https://prajith04-fastapi.hf.space/find_disease_list', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ symptom: symptoms })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            setMatchingSymptoms(data.unique_symptoms_list);
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }
    };

    // Handle submission of selected symptoms
    const handleSelectedSymptomsSubmit = async (event) => {
        event.preventDefault();
        const selectedSymptomValues = Array.from(event.target.elements)
            .filter(element => element.checked)
            .map(element => element.value);

        setSelectedSymptoms(selectedSymptomValues);

        try {
            const response = await fetch('https://prajith04-fastapi.hf.space/find_disease', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ selected_symptoms: selectedSymptomValues })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            // Check if the response contains a single disease or a list of diseases
            if (data.disease) {
                setSingleDisease(data.disease); // Set the single disease
            } else {
                // Remove duplicate diseases by 'Disease' name and sort them alphabetically
                const uniqueDiseases = data.disease_list
                    .filter((disease, index, self) =>
                        index === self.findIndex((d) => d.Disease === disease.Disease)
                    )
                    .sort((a, b) => a.Disease.localeCompare(b.Disease));

                setDiseases(uniqueDiseases); // Set the deduplicated and sorted list of diseases
                setSingleDisease(null); // Clear single disease if list is returned
            }

            setMatchingSymptoms(data.unique_symptoms_list);
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }
    };

    // Handle checkbox selection and preserve previously selected symptoms
    const handleCheckboxChange = (event) => {
        const value = event.target.value;
        setSelectedSymptoms(prevSelected =>
            event.target.checked
                ? [...prevSelected, value]
                : prevSelected.filter(symptom => symptom !== value)
        );
    };

    const handlellm = async (event) => {
        event.preventDefault();
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${api}`, // Replace with your OpenAI API key
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'meta-llama/llama-3.2-90b-vision-instruct:free',
                    messages: diseases.map(disease => ({
                        role: 'user',
                        content: `Explain the disease ${disease.Disease} and its treatments. ${userPrompt}`
                    }))
                })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            console.log(data); // Log the LLM response
            setLlmResponse(data.choices[0].message.content); // Set the LLM response
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }
    }

    return (
        <div>
            <form onSubmit={handleSubmit} className='symptom-form'>
                <div className='container'>
                    <div className='input-group'>
                <label className="symptom-label" htmlFor="symptom">Enter your symptoms:</label>
                <input 
                    className='symptom'
                    type="text" 
                    id="symptom" 
                    name="symptom" 
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    required
                />
                    </div>
                </div>
                <button className='glow-on-hover'type="submit">Submit</button>
            </form>
            
            <div>
                {matchingSymptoms.length > 0 && (
                    <form className='symptoms-form' onSubmit={handleSelectedSymptomsSubmit}>
                            {matchingSymptoms.map((symptom, index) => (
                                    <div className='custom-checkbox'>
                                    <input 
                                        type="checkbox"
                                        id={index}
                                        name={index}
                                        value={symptom}
                                        checked={selectedSymptoms.includes(symptom)} // Preserve selected checkboxes
                                        onChange={handleCheckboxChange}
                                        className='checkbox'
                                    />
                                    <label htmlFor={index}>{symptom}</label>
                                    </div>
                                
                            ))}
                       
                        <button className='glow-on-hover' type="submit">Submit Selected Symptoms</button>
                    </form>
                )}
            </div>

            <div>
                {singleDisease ? (
                    <div>
                        <h3>Single Disease Found:</h3>
                        <p><strong>Disease:</strong> {singleDisease.Disease}</p>
                        <p><strong>Symptoms:</strong> {singleDisease.Symptoms.join(', ')}</p>
                        <p><strong>Treatments:</strong> {singleDisease.Treatments}</p>
                    </div>
                ) : diseases.length > 0 ? (
                    <div>
                        <h3>Matching Diseases:</h3>
                        <ul>
                            {diseases.map((disease, index) => (
                                <li key={index}>
                                    <p><strong>Disease:</strong> {disease.Disease}</p>
                                    <p><strong>Symptoms:</strong> {disease.Symptoms.join(', ')}</p>
                                    <p><strong>Treatments:</strong> {disease.Treatments}</p>
                                </li>
                            ))}
                        </ul>
                        <div>
                            <label htmlFor="userPrompt">Optional Prompt:</label>
                            <input 
                                type="text" 
                                id="userPrompt" 
                                name="userPrompt" 
                                value={userPrompt}
                                onChange={(e) => setUserPrompt(e.target.value)}
                            />
                        </div>
                        <button className='glow-on-hover' onClick={handlellm}>Submit Disease</button>
                        {llmResponse && (
                            <div>
                                <h3>LLM Response:</h3>
                                {llmResponse.split('\n').map((line, index) => {
        if (line.startsWith('## ')) {
          return <h2 key={index}>{line.replace('## ', '')}</h2>; // Convert to heading
        } else if (line.startsWith('**')) {
          const parts = line.split(': ');
          return (
            <p key={index}>
              <strong>{parts[0].replace(/\*\*/g, '').trim()}:</strong> {parts[1]}
            </p>
          ); // Bold the term before the colon
        } else if (line.trim()) {
          return <p key={index}>{line}</p>; // Regular paragraph
        }
        return null; // Ignore empty lines
      })}
                            </div>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export default Body;
