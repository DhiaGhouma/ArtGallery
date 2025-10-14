export default function Test() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-8">
        <h1 className="text-4xl font-bold gradient-text mb-4">
          Test Page
        </h1>
        <p className="text-muted-foreground mb-4">
          If you see a dark background and purple gradient text, CSS is working!
        </p>
        
        <div className="glass-effect p-6 rounded-2xl mb-4">
          <p>This should have a glass effect</p>
        </div>

        <button className="glow-effect px-6 py-3 bg-primary text-primary-foreground rounded-lg">
          Glowing Button
        </button>
      </div>
    </div>
  );
}