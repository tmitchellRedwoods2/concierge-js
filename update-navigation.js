const fs = require('fs');
const path = require('path');

// Navigation template with all tabs
const navigationTemplate = `      {/* Navigation Tabs */}
      <div className="bg-gray-50 border-b">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto gap-1 py-3">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="whitespace-nowrap text-xs px-3 py-2">
              🏠 Dashboard
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/expenses")} className="whitespace-nowrap text-xs px-3 py-2">
              💰 Expenses
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/investments")} className="whitespace-nowrap text-xs px-3 py-2">
              📈 Investments
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/health")} className="whitespace-nowrap text-xs px-3 py-2">
              🏥 Health
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/insurance")} className="whitespace-nowrap text-xs px-3 py-2">
              🛡️ Insurance
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/legal")} className="whitespace-nowrap text-xs px-3 py-2">
              ⚖️ Legal
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/tax")} className="whitespace-nowrap text-xs px-3 py-2">
              📊 Tax
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/travel")} className="whitespace-nowrap text-xs px-3 py-2">
              ✈️ Travel
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/messages")} className="whitespace-nowrap text-xs px-3 py-2">
              💬 Messages
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/ai-agents")} className="whitespace-nowrap text-xs px-3 py-2">
              🤖 AI Agents
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/settings")} className="whitespace-nowrap text-xs px-3 py-2">
              ⚙️ Settings
            </Button>
          </div>
        </div>
      </div>`;

// Pages to update (excluding dashboard which is already done)
const pages = [
  'investments',
  'health', 
  'insurance',
  'legal',
  'tax',
  'travel',
  'messages',
  'ai-agents',
  'settings'
];

// Function to update navigation in a file
function updateNavigation(filePath, currentTab) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find and replace the navigation section
    const navRegex = /      \{\/\* Navigation Tabs \*\/\}[\s\S]*?      <\/div>\s*<\/div>\s*<\/div>/;
    
    // Create the navigation with the current tab highlighted
    const updatedNavigation = navigationTemplate.replace(
      `onClick={() => router.push("/${currentTab}")} className="whitespace-nowrap text-xs px-3 py-2">`,
      `className="bg-blue-100 text-blue-800 whitespace-nowrap text-xs px-3 py-2">`
    );
    
    content = content.replace(navRegex, updatedNavigation);
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated navigation for ${currentTab}`);
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

// Update all pages
pages.forEach(page => {
  const filePath = path.join(__dirname, 'src', 'app', page, 'page.tsx');
  updateNavigation(filePath, page);
});

console.log('🎉 Navigation update complete!');
