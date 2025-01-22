import neo4j from 'neo4j-driver';  // Correct import
import { URI, USERNAME, PASSWORD } from '../../config';  // Correctly import your config

// Initialize the driver
const driver = neo4j.driver(URI, neo4j.auth.basic(USERNAME, PASSWORD));

export default async function handler(req, res) {
    try {
        // You can check the Neo4j connection here
        const session = driver.session();  // Open a session to test the connection
        await session.run('MATCH (n) RETURN n LIMIT 1');  // A simple query to test the database

        await session.close();  // Close the session

        return res.status(200).json({ status: 'ok' });  // If successful, return 'ok'
    } catch (error) {
        console.error('Error in /api/health route:', error);
        return res.status(500).json({ error: 'Internal Server Error' });  // Return 500 error if connection fails
    }
}
