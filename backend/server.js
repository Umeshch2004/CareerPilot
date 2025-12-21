/**
 * CareerPilot Backend Server
 * Technology: Node.js, Express, MySQL
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a MySQL database named 'careerpilot'
 * 2. Create the following tables:
 * 
 * CREATE TABLE users (
 *   id INT AUTO_INCREMENT PRIMARY KEY,
 *   name VARCHAR(255),
 *   email VARCHAR(255) UNIQUE NOT NULL,
 *   password VARCHAR(255) NOT NULL,
 *   role VARCHAR(255),
 *   bio TEXT,
 *   location VARCHAR(255),
 *   avatar_url MEDIUMTEXT,
 *   target_role VARCHAR(255),
 *   joined_date VARCHAR(255),
 *   open_to_opportunities BOOLEAN,
 *   readiness_score INT,
 *   profile_strength INT
 * );
 * 
 * CREATE TABLE skills (
 *   id INT AUTO_INCREMENT PRIMARY KEY,
 *   user_id INT,
 *   name VARCHAR(255),
 *   category VARCHAR(50),
 *   level VARCHAR(50),
 *   verified BOOLEAN,
 *   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
 * );
 * 
 * CREATE TABLE experience (
 *   id INT AUTO_INCREMENT PRIMARY KEY,
 *   user_id INT,
 *   company VARCHAR(255),
 *   role VARCHAR(255),
 *   start_date VARCHAR(50),
 *   end_date VARCHAR(50),
 *   description TEXT,
 *   type VARCHAR(50),
 *   skills_used TEXT,
 *   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
 * );
 * 
 * CREATE TABLE projects (
 *   id INT AUTO_INCREMENT PRIMARY KEY,
 *   user_id INT,
 *   name VARCHAR(255),
 *   type VARCHAR(50),
 *   description TEXT,
 *   tech_stack TEXT,
 *   image MEDIUMTEXT,
 *   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
 * );
 * 
 * CREATE TABLE education (
 *   id INT AUTO_INCREMENT PRIMARY KEY,
 *   user_id INT,
 *   institution VARCHAR(255),
 *   degree VARCHAR(255),
 *   year VARCHAR(50),
 *   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
 * );
 * 
 * CREATE TABLE certifications (
 *   id INT AUTO_INCREMENT PRIMARY KEY,
 *   user_id INT,
 *   name VARCHAR(255),
 *   issuer VARCHAR(255),
 *   date VARCHAR(50),
 *   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
 * );
 * 
 * CREATE TABLE tasks (
 *   id INT AUTO_INCREMENT PRIMARY KEY,
 *   user_id INT,
 *   title VARCHAR(255),
 *   type VARCHAR(50),
 *   duration VARCHAR(50),
 *   status VARCHAR(50),
 *   difficulty VARCHAR(50),
 *   description TEXT,
 *   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
 * );
 */

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for avatar/resume uploads

// Database Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'careerpilot',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// --- HELPER FUNCTIONS ---

const getUserByEmail = async (email) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
};

// --- AUTH ROUTES ---

app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const joinedDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        await pool.query(
            'INSERT INTO users (name, email, password, joined_date, avatar_url, open_to_opportunities, readiness_score, profile_strength) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [name, email, password, joinedDate, '', false, 0, 0]
        );

        const user = await getUserByEmail(email);
        
        const profile = {
            ...user,
            id: user.id.toString(),
            avatarUrl: user.avatar_url || '',
            joinedDate: user.joined_date,
            openToOpportunities: Boolean(user.open_to_opportunities),
            targetRole: user.target_role || '',
            readinessScore: user.readiness_score || 0,
            profileStrength: user.profile_strength || 0,
            skills: [],
            experience: [],
            projects: [],
            education: [],
            certifications: [],
            insights: []
        };
        
        delete profile.password;
        res.json(profile);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await getUserByEmail(email);
        
        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Fetch user data via the GET logic to include relationships
        // For simplicity in login, we return the base user and let the app fetch full profile
        const profile = {
            ...user,
            id: user.id.toString(),
            avatarUrl: user.avatar_url || '',
            joinedDate: user.joined_date,
            targetRole: user.target_role || '',
            openToOpportunities: Boolean(user.open_to_opportunities),
            readinessScore: user.readiness_score || 0,
            profileStrength: user.profile_strength || 0,
            skills: [], // Frontend will fetch full profile on dashboard load
            experience: [],
            projects: [],
            education: [],
            certifications: [],
            insights: []
        };
        
        delete profile.password;
        res.json(profile);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// --- USER ROUTES ---

app.get('/api/user/:email', async (req, res) => {
    try {
        const user = await getUserByEmail(req.params.email);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const userId = user.id;

        // Parallel fetch for all related data
        const [skills] = await pool.query('SELECT * FROM skills WHERE user_id = ?', [userId]);
        const [experience] = await pool.query('SELECT * FROM experience WHERE user_id = ?', [userId]);
        const [projects] = await pool.query('SELECT * FROM projects WHERE user_id = ?', [userId]);
        const [education] = await pool.query('SELECT * FROM education WHERE user_id = ?', [userId]);
        const [certifications] = await pool.query('SELECT * FROM certifications WHERE user_id = ?', [userId]);

        const profile = {
            ...user,
            id: user.id.toString(),
            avatarUrl: user.avatar_url || '',
            targetRole: user.target_role || '',
            joinedDate: user.joined_date,
            openToOpportunities: Boolean(user.open_to_opportunities),
            readinessScore: user.readiness_score || 0,
            profileStrength: user.profile_strength || 0,
            skills: skills.map(s => ({...s, verified: Boolean(s.verified)})),
            experience: experience.map(e => ({
                ...e,
                startDate: e.start_date,
                endDate: e.end_date,
                skillsUsed: e.skills_used ? e.skills_used.split(',') : []
            })),
            projects: projects.map(p => ({
                ...p,
                techStack: p.tech_stack ? p.tech_stack.split(',') : []
            })),
            education,
            certifications,
            insights: [], // Could be persisted if needed
            preferences: { // Mock prefs for now
                weeklyHours: 10,
                learningStyle: 'Visual',
                remotePreference: 'Remote',
                targetLocations: [],
                salaryRange: '',
                availability: 'Immediate',
                companySize: 'Startup'
            }
        };

        delete profile.password;
        res.json(profile);
    } catch (error) {
        console.error('Fetch profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/user/:email', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const email = req.params.email;
        const updates = req.body;
        
        const [users] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
             throw new Error('User not found');
        }
        const userId = users[0].id;

        // 1. Update Base User Table
        const userFields = {};
        if (updates.name) userFields.name = updates.name;
        if (updates.role) userFields.role = updates.role;
        if (updates.bio) userFields.bio = updates.bio;
        if (updates.location) userFields.location = updates.location;
        if (updates.targetRole) userFields.target_role = updates.targetRole;
        if (updates.avatarUrl) userFields.avatar_url = updates.avatarUrl;
        if (updates.openToOpportunities !== undefined) userFields.open_to_opportunities = updates.openToOpportunities;
        if (updates.profileStrength) userFields.profile_strength = updates.profileStrength;

        if (Object.keys(userFields).length > 0) {
            const setClause = Object.keys(userFields).map(k => `${k} = ?`).join(', ');
            await connection.query(`UPDATE users SET ${setClause} WHERE id = ?`, [...Object.values(userFields), userId]);
        }

        // 2. Update Skills (Replace All Strategy)
        if (updates.skills) {
            await connection.query('DELETE FROM skills WHERE user_id = ?', [userId]);
            for (const s of updates.skills) {
                await connection.query(
                    'INSERT INTO skills (user_id, name, category, level, verified) VALUES (?, ?, ?, ?, ?)',
                    [userId, s.name, s.category, s.level, s.verified || false]
                );
            }
        }

        // 3. Update Experience
        if (updates.experience) {
            await connection.query('DELETE FROM experience WHERE user_id = ?', [userId]);
            for (const e of updates.experience) {
                const skillsUsedStr = Array.isArray(e.skillsUsed) ? e.skillsUsed.join(',') : '';
                await connection.query(
                    'INSERT INTO experience (user_id, company, role, start_date, end_date, description, type, skills_used) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [userId, e.company, e.role, e.startDate, e.endDate, e.description, e.type, skillsUsedStr]
                );
            }
        }

        // 4. Update Projects
        if (updates.projects) {
            await connection.query('DELETE FROM projects WHERE user_id = ?', [userId]);
            for (const p of updates.projects) {
                const stackStr = Array.isArray(p.techStack) ? p.techStack.join(',') : p.techStack;
                await connection.query(
                    'INSERT INTO projects (user_id, name, type, description, tech_stack, image) VALUES (?, ?, ?, ?, ?, ?)',
                    [userId, p.name, p.type, p.description, stackStr, p.image || '']
                );
            }
        }

        // 5. Update Education
        if (updates.education) {
            await connection.query('DELETE FROM education WHERE user_id = ?', [userId]);
            for (const edu of updates.education) {
                await connection.query(
                    'INSERT INTO education (user_id, institution, degree, year) VALUES (?, ?, ?, ?)',
                    [userId, edu.institution, edu.degree, edu.year]
                );
            }
        }

        // 6. Update Certifications
        if (updates.certifications) {
            await connection.query('DELETE FROM certifications WHERE user_id = ?', [userId]);
            for (const cert of updates.certifications) {
                await connection.query(
                    'INSERT INTO certifications (user_id, name, issuer, date) VALUES (?, ?, ?, ?)',
                    [userId, cert.name, cert.issuer, cert.date]
                );
            }
        }

        await connection.commit();
        res.json({ message: 'Profile updated successfully' });

    } catch (error) {
        await connection.rollback();
        console.error('Update error:', error);
        res.status(500).json({ error: 'Update failed' });
    } finally {
        connection.release();
    }
});

// --- TASK ROUTES ---

app.post('/api/tasks', async (req, res) => {
    try {
        const { email, title, type, duration, difficulty, description } = req.body;
        const user = await getUserByEmail(email);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const [result] = await pool.query(
            'INSERT INTO tasks (user_id, title, type, duration, status, difficulty, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [user.id, title, type, duration, 'Todo', difficulty, description]
        );
        res.json({ id: result.insertId, ...req.body });
    } catch (error) {
        console.error('Task creation error:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

app.get('/api/tasks/:email', async (req, res) => {
    try {
        const user = await getUserByEmail(req.params.email);
        if (!user) return res.json([]); 

        const [tasks] = await pool.query('SELECT * FROM tasks WHERE user_id = ?', [user.id]);
        res.json(tasks);
    } catch (error) {
        console.error('Task fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});