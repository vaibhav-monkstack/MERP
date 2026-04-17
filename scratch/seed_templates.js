/**
 * Seed script: Populates 10 lock product templates with their BOM parts.
 * Run once: node scratch/seed_templates.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const pool = require('../backend/config/db');

const templates = [
  {
    name: 'Deadbolt Lock',
    description: 'Single-cylinder deadbolt for residential and commercial doors',
    parts: [
      { part_name: 'Euro Cylinder 70mm',            qty_per_unit: 1 },
      { part_name: 'Deadbolt (Solid Throw Bolt)',   qty_per_unit: 1 },
      { part_name: 'Strike Plate (Stainless Steel)', qty_per_unit: 1 },
      { part_name: 'Thumbturn Assembly',             qty_per_unit: 1 },
    ],
  },
  {
    name: 'Knob Lock',
    description: 'Standard door knob lock for interior and light exterior doors',
    parts: [
      { part_name: 'Door Knob Set',              qty_per_unit: 1 },
      { part_name: 'Tubular Latch 60mm Backset', qty_per_unit: 1 },
      { part_name: 'Strike Plate',               qty_per_unit: 1 },
      { part_name: 'Spindle Rod',                qty_per_unit: 1 },
    ],
  },
  {
    name: 'Lever Handle Lock',
    description: 'ADA-compliant lever handle lock for doors',
    parts: [
      { part_name: 'Lever Handle Set',  qty_per_unit: 1 },
      { part_name: 'Euro Cylinder',     qty_per_unit: 1 },
      { part_name: 'Spring Latch Bolt', qty_per_unit: 1 },
      { part_name: 'Backplate',          qty_per_unit: 2 },
    ],
  },
  {
    name: 'Padlock',
    description: 'Portable shackle lock for gates, chains, and storage',
    parts: [
      { part_name: 'Hardened Steel Shackle', qty_per_unit: 1 },
      { part_name: 'Brass Lock Body',        qty_per_unit: 1 },
      { part_name: 'Pin Tumbler Cylinder',   qty_per_unit: 1 },
      { part_name: 'Compression Springs',    qty_per_unit: 5 },
    ],
  },
  {
    name: 'Mortise Lock',
    description: 'Heavy-duty lock fitted into a pocket (mortise) in the door',
    parts: [
      { part_name: 'Mortise Lock Case',    qty_per_unit: 1 },
      { part_name: 'Euro Profile Cylinder', qty_per_unit: 1 },
      { part_name: '5-Lever Deadbolt',     qty_per_unit: 1 },
      { part_name: 'Strike Plate',         qty_per_unit: 1 },
    ],
  },
  {
    name: 'Magnetic Lock',
    description: 'Electromagnetic lock for access control systems',
    parts: [
      { part_name: 'Electromagnet 600 lbs',  qty_per_unit: 1 },
      { part_name: 'Armature Plate',         qty_per_unit: 1 },
      { part_name: 'SMPS Power Supply 12V',  qty_per_unit: 1 },
      { part_name: 'Mounting Bracket',       qty_per_unit: 2 },
    ],
  },
  {
    name: 'Smart Lock',
    description: 'IoT-enabled electronic lock with RFID and app control',
    parts: [
      { part_name: 'ESP32 Dev Board',           qty_per_unit: 1 },
      { part_name: 'Solenoid Lock 12V DC',      qty_per_unit: 1 },
      { part_name: 'RFID Reader Module RC522',  qty_per_unit: 1 },
      { part_name: 'Lithium-ion Battery Pack',  qty_per_unit: 1 },
    ],
  },
  {
    name: 'Rim Lock',
    description: 'Surface-mounted lock fitted on the inside face of a door',
    parts: [
      { part_name: 'Rim Lock Case', qty_per_unit: 1 },
      { part_name: 'Rim Cylinder',  qty_per_unit: 1 },
      { part_name: 'Latch Bolt',    qty_per_unit: 1 },
      { part_name: 'Strike Plate',  qty_per_unit: 1 },
    ],
  },
  {
    name: 'Cam Lock (Drawer/Locker)',
    description: 'Compact rotary lock for drawers, lockers, and cabinets',
    parts: [
      { part_name: 'Cam Cylinder',               qty_per_unit: 1 },
      { part_name: 'Cam (Flat Metal Tailpiece)', qty_per_unit: 1 },
      { part_name: 'Lock Nut',                   qty_per_unit: 1 },
      { part_name: 'Key',                        qty_per_unit: 2 },
    ],
  },
  {
    name: 'Sliding Door Lock',
    description: 'Lock designed for sliding/patio door security',
    parts: [
      { part_name: 'Hook Bolt',        qty_per_unit: 1 },
      { part_name: 'Flush Handle',     qty_per_unit: 1 },
      { part_name: 'Mortise Cylinder', qty_per_unit: 1 },
      { part_name: 'Strike Plate',     qty_per_unit: 1 },
    ],
  },
];

async function seed() {
  console.log('--- Seeding Product Templates (BOM) ---');
  try {
    for (const t of templates) {
      // Upsert template
      const [existing] = await pool.query(
        'SELECT id FROM product_templates WHERE name = ?', [t.name]
      );

      let templateId;
      if (existing.length > 0) {
        templateId = existing[0].id;
        console.log(`↩️  Template already exists: "${t.name}" (id=${templateId}) — skipping insert`);
      } else {
        const [res] = await pool.query(
          'INSERT INTO product_templates (name, description) VALUES (?,?)',
          [t.name, t.description]
        );
        templateId = res.insertId;
        console.log(`✅ Created template: "${t.name}" (id=${templateId})`);
      }

      // Clear old parts and re-insert
      await pool.query('DELETE FROM template_parts WHERE template_id = ?', [templateId]);
      for (const p of t.parts) {
        await pool.query(
          'INSERT INTO template_parts (template_id, part_name, qty_per_unit, unit) VALUES (?,?,?,?)',
          [templateId, p.part_name, p.qty_per_unit, 'pcs']
        );
      }
      console.log(`   ↳ ${t.parts.length} parts seeded`);
    }
    console.log('--- Seeding Complete ---');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding Error:', err.message);
    process.exit(1);
  }
}

seed();
