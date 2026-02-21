export default function LoginPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold mb-2">Nutriclaude</h1>
      <p className="text-text-muted text-sm mb-8">AI-powered nutrition & fitness tracking</p>
      <div className="bg-card rounded-xl border border-border p-6 max-w-sm text-center">
        <p className="text-text mb-4">
          To access your dashboard, send <code className="bg-bg px-1.5 py-0.5 rounded text-accent-green">/login</code> to
          the Nutriclaude Telegram bot.
        </p>
        <p className="text-text-muted text-sm">
          Don't have access yet? Send <code className="bg-bg px-1.5 py-0.5 rounded text-accent-green">/start</code> to
          the bot to create your account.
        </p>
      </div>
    </div>
  )
}
