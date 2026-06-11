function AuthForm({
  title = 'Login',
  fields = [],
  submitLabel = 'Login',
  alternateLabel = 'Create account',
  onSubmit = (event) => event.preventDefault(),
  onAlternate = () => {},
  values = {},
  onChange = () => {},
  error = '',
  success = '',
}) {
  return (
    <div className="auth-card">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Document Studio</p>
        <h2 className="text-3xl font-bold mt-2">{title}</h2>
        <p className="text-slate-400 mt-2">Login to manage your documents in one place.</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {fields.map((field) => (
          <input
            key={field.name}
            name={field.name}
            type={field.type}
            placeholder={field.placeholder}
            value={values[field.name] || ''}
            onChange={onChange}
            className="field-input"
          />
        ))}
        <button type="submit" className="primary-button w-full">{submitLabel}</button>
      </form>
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      {success ? <p className="mt-3 text-sm text-emerald-300">{success}</p> : null}
      <p className="mt-4 text-sm text-slate-300">
        <button type="button" onClick={onAlternate} className="link-button">{alternateLabel}</button>
      </p>
    </div>
  )
}

export default AuthForm