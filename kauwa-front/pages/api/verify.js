import neo4j from 'neo4j-driver';  // Correct import for neo4j
import VerificationAgent from '../../verification/enhanced_search_system'; // Correct import for VerificationAgent
import { API_KEY, CSE_ID, GSE_API_KEY, URI, USERNAME, PASSWORD } from '../../config';

// Initialize Neo4j driver
const driver = neo4j.driver(URI, neo4j.auth.basic(USERNAME, PASSWORD));  // Correct initialization

// Initialize Verification System
const verificationSystem = new VerificationAgent(API_KEY, CSE_ID, GSE_API_KEY);

const convertToJSON = (obj) => {
    if (typeof obj === 'number' || obj instanceof Number) {
        return obj;
    }
    if (obj && typeof obj === 'object') {
        const newObj = {};
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                newObj[key] = convertToJSON(obj[key]);
            }
        }
        return newObj;
    }
    return obj;
};

const createQueryNode = async (session, queryId, queryText, verificationResult) => {
    const query = `
        MERGE (q:Query {query_id: $query_id})
        SET q.text = $query_text,
            q.is_true = $is_true,
            q.confidence = $confidence,
            q.verification_data = $verification_data,
            q.timestamp = timestamp()
    `;
    await session.run(query, {
        query_id: queryId,
        query_text: queryText,
        is_true: verificationResult.verification?.verdict === 'TRUE', // ensure verification is checked
        confidence: parseFloat(verificationResult.verification?.confidence) || 0,  // Add a fallback to 0 if no confidence
        verification_data: JSON.stringify(verificationResult)
    });
};

const getQueryTruthValue = async (session, queryId) => {
    const result = await session.run('MATCH (q:Query {query_id: $query_id}) RETURN q.is_true AS is_true', {
        query_id: queryId
    });
    return result.records.length ? result.records[0].get('is_true') : null;
};

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Query not provided' });
        }

        const session = driver.session();
        try {
            // First, check if the query exists in the knowledge graph
            const queryId = require('crypto').createHash('md5').update(query).digest('hex');
            let existingTruth = await getQueryTruthValue(session, queryId);
            if (existingTruth !== null) {
                return res.status(200).json({ result: existingTruth, neo4j_connected: true });
            }

            // If not in the graph, verify the query using the VerificationAgent
            const verificationResult = await verificationSystem.processQuery(query);
            const booleanResult = verificationResult.verification?.verdict === 'TRUE'; // Safety check on verification
            const confidence = parseFloat(verificationResult.verification?.confidence) || 0;
            const reason = verificationResult.verification?.reason || 'Reason not available';

            // Add to Neo4j if result is TRUE
            if (booleanResult) {
                await createQueryNode(session, queryId, query, verificationResult);
            }

            return res.status(200).json({
                result: booleanResult,
                confidence,
                reason,
                neo4j_connected: true
            });
        } catch (error) {
            console.error('Error during verification:', error);
            return res.status(500).json({ error: 'Internal server error' });
        } finally {
            session.close(); // Always ensure session is closed
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
