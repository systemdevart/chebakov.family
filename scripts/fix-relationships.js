#!/usr/bin/env node

/**
 * Script to fix bidirectional relationships in family data
 * Run with: node scripts/fix-relationships.js
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'familyData.json');

function fixRelationships() {
  console.log('Reading family data...');
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

  const memberMap = new Map(data.members.map(m => [m.id, m]));
  let fixCount = 0;

  // Fix spouse relationships (bidirectional)
  console.log('\nFixing spouse relationships...');
  data.members.forEach(member => {
    member.spouseIds = member.spouseIds || [];
    member.spouseIds.forEach(spouseId => {
      const spouse = memberMap.get(spouseId);
      if (spouse) {
        spouse.spouseIds = spouse.spouseIds || [];
        if (!spouse.spouseIds.includes(member.id)) {
          spouse.spouseIds.push(member.id);
          console.log(`  Added ${member.firstName} to ${spouse.firstName}'s spouseIds`);
          fixCount++;
        }
      }
    });
  });

  // Fix parent-child relationships (bidirectional)
  console.log('\nFixing parent-child relationships...');
  data.members.forEach(member => {
    member.parentIds = member.parentIds || [];
    member.childrenIds = member.childrenIds || [];

    // If member has parents, ensure parents have member as child
    member.parentIds.forEach(parentId => {
      const parent = memberMap.get(parentId);
      if (parent) {
        parent.childrenIds = parent.childrenIds || [];
        if (!parent.childrenIds.includes(member.id)) {
          parent.childrenIds.push(member.id);
          console.log(`  Added ${member.firstName} to ${parent.firstName}'s childrenIds`);
          fixCount++;
        }
      }
    });

    // If member has children, ensure children have member as parent
    member.childrenIds.forEach(childId => {
      const child = memberMap.get(childId);
      if (child) {
        child.parentIds = child.parentIds || [];
        if (!child.parentIds.includes(member.id)) {
          child.parentIds.push(member.id);
          console.log(`  Added ${member.firstName} to ${child.firstName}'s parentIds`);
          fixCount++;
        }
      }
    });
  });

  // Sort childrenIds by birth date
  console.log('\nSorting children by birth date...');
  data.members.forEach(member => {
    if (member.childrenIds && member.childrenIds.length > 1) {
      member.childrenIds.sort((a, b) => {
        const childA = memberMap.get(a);
        const childB = memberMap.get(b);
        if (!childA?.birthDate && !childB?.birthDate) return 0;
        if (!childA?.birthDate) return 1;
        if (!childB?.birthDate) return -1;
        return new Date(childA.birthDate).getTime() - new Date(childB.birthDate).getTime();
      });
    }
  });

  // Write fixed data
  console.log(`\nTotal fixes: ${fixCount}`);
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  console.log('Data saved successfully!');

  // Print summary
  console.log('\n--- Summary ---');
  data.members.forEach(member => {
    const spouses = member.spouseIds?.map(id => memberMap.get(id)?.firstName).join(', ') || 'none';
    const parents = member.parentIds?.map(id => memberMap.get(id)?.firstName).join(', ') || 'none';
    const children = member.childrenIds?.map(id => memberMap.get(id)?.firstName).join(', ') || 'none';
    console.log(`${member.firstName} ${member.lastName}:`);
    console.log(`  Spouses: ${spouses}`);
    console.log(`  Parents: ${parents}`);
    console.log(`  Children: ${children}`);
  });
}

fixRelationships();
