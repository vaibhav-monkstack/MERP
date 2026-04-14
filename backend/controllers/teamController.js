// Import the database connection pool for running queries
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// ============================================================
// TEAM CONTROLLER — Handles team management and worker account operations
// Teams organize Production Staff workers into groups.
// This controller supports: creating/editing/deleting teams,
// adding/removing team members, and creating new worker accounts.
// ============================================================

// GET ALL TEAMS — Fetches every team along with its members
// Called when GET /api/teams is hit
exports.getTeams = async (req, res) => {
  try {
    // Fetch all teams sorted alphabetically by name
    const [teams] = await pool.query('SELECT * FROM teams ORDER BY name ASC');

    // For each team, fetch its members by joining team_members with users table
    const teamsWithMembers = [];
    for (const team of teams) {
      // JOIN query: get user details for each member assigned to this team
      const [members] = await pool.query(
        `SELECT u.id, u.email, u.name, u.role 
         FROM team_members tm 
         JOIN users u ON tm.userId = u.id 
         WHERE tm.teamId = ?
         ORDER BY u.name ASC`,
        [team.id]
      );
      // Combine team data with its members array
      teamsWithMembers.push({ ...team, members });
    }

    // Return the array of teams, each containing its members
    res.json(teamsWithMembers);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ message: 'Error fetching teams' });
  }
};

// CREATE TEAM — Creates a new team with just a name (no members initially)
// Called when POST /api/teams is hit
exports.createTeam = async (req, res) => {
  const { name } = req.body; // Get the team name from the request body
  // Validate that a name was provided
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Team name is required' });
  }

  try {
    // Insert the new team into the teams table
    const [result] = await pool.query('INSERT INTO teams (name) VALUES (?)', [name.trim()]);
    // Return 201 Created with the new team data (empty members array)
    res.status(201).json({ id: result.insertId, name: name.trim(), members: [] });
  } catch (error) {
    // Handle duplicate team name error (team names must be unique)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'A team with this name already exists' });
    }
    console.error('Error creating team:', error);
    res.status(500).json({ message: 'Error creating team' });
  }
};

// UPDATE TEAM — Changes a team's name
// Called when PUT /api/teams/:id is hit (e.g., PUT /api/teams/1)
exports.updateTeam = async (req, res) => {
  const { id } = req.params;  // Get the team ID from the URL
  const { name } = req.body;  // Get the new name from the request body

  // Validate that a name was provided
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Team name is required' });
  }

  try {
    // Update the team name in the database
    const [result] = await pool.query('UPDATE teams SET name = ? WHERE id = ?', [name.trim(), id]);
    // If no rows were affected, the team doesn't exist
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Team not found' });
    }
    res.json({ message: 'Team updated successfully' });
  } catch (error) {
    // Handle duplicate team name error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'A team with this name already exists' });
    }
    console.error('Error updating team:', error);
    res.status(500).json({ message: 'Error updating team' });
  }
};

// DELETE TEAM — Permanently removes a team and all its member assignments
// Called when DELETE /api/teams/:id is hit
// Note: ON DELETE CASCADE in team_members automatically removes all member links
exports.deleteTeam = async (req, res) => {
  const { id } = req.params; // Get the team ID from the URL

  try {
    // Delete the team (cascading deletes handle team_members entries)
    const [result] = await pool.query('DELETE FROM teams WHERE id = ?', [id]);
    // If no rows were affected, the team doesn't exist
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Team not found' });
    }
    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ message: 'Error deleting team' });
  }
};

// ADD MEMBER — Assigns an existing user to a team
// Called when POST /api/teams/:id/members is hit
// Request body should contain: userId (the ID of the worker to add)
exports.addMember = async (req, res) => {
  const { id } = req.params;    // Team ID from the URL
  const { userId } = req.body;  // User ID from the request body

  // Validate that a userId was provided
  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  try {
    // Insert a new team_members record linking the user to the team
    await pool.query('INSERT INTO team_members (teamId, userId) VALUES (?, ?)', [id, userId]);
    
    // Fetch the user's info to return in the response
    const [users] = await pool.query('SELECT id, email, name, role FROM users WHERE id = ?', [userId]);
    res.status(201).json({ message: 'Member added successfully', member: users[0] });
  } catch (error) {
    // Handle duplicate assignment error (user already in this team)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'User is already a member of this team' });
    }
    console.error('Error adding member:', error);
    res.status(500).json({ message: 'Error adding member' });
  }
};

// REMOVE MEMBER — Removes a user from a team (does NOT delete the user account)
// Called when DELETE /api/teams/:id/members/:userId is hit
exports.removeMember = async (req, res) => {
  const { id, userId } = req.params; // Team ID and User ID from the URL

  try {
    // Delete the team_members record that links this user to this team
    const [result] = await pool.query(
      'DELETE FROM team_members WHERE teamId = ? AND userId = ?',
      [id, userId]
    );
    // If no rows were affected, the member wasn't in this team
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Member not found in this team' });
    }
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ message: 'Error removing member' });
  }
};

// GET ALL WORKERS — Fetches all users with the "Production Staff" role
// Called when GET /api/teams/workers is hit
// Used by the Manage Teams page to show available workers
exports.getWorkers = async (req, res) => {
  try {
    // Query for all users who have the "Production Staff" role, sorted by name
    const [workers] = await pool.query(
      "SELECT id, email, name, role FROM users WHERE role = 'Production Staff' ORDER BY name ASC"
    );
    res.json(workers); // Return the array of worker users
  } catch (error) {
    console.error('Error fetching workers:', error);
    res.status(500).json({ message: 'Error fetching workers' });
  }
};

// CREATE WORKER — Creates a new Production Staff user account
// Called when POST /api/teams/workers is hit
// This allows Job Managers to create new worker accounts from the Manage Teams page
// Request body should contain: email, name, password
exports.createWorker = async (req, res) => {
  const { email, name, password } = req.body; // Extract account details

  // Validate that all required fields are provided
  if (!email || !name || !password) {
    return res.status(400).json({ message: 'Email, name, and password are required' });
  }

  try {
    // Hash the password for security using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert a new user with the "Production Staff" role
    const [result] = await pool.query(
      "INSERT INTO users (email, name, password, role) VALUES (?, ?, ?, 'Production Staff')",
      [email.trim(), name.trim(), hashedPassword] // Store the hashed password, not plain text
    );
    // Return 201 Created with the new worker's data (excluding password for security)
    res.status(201).json({
      id: result.insertId,       // Auto-generated user ID
      email: email.trim(),       // Worker's email address
      name: name.trim(),         // Worker's display name
      role: 'Production Staff'   // Always set to Production Staff
    });
  } catch (error) {
    // Handle duplicate email error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'A user with this email already exists' });
    }
    console.error('Error creating worker:', error);
    res.status(500).json({ message: 'Error creating worker' });
  }
};
