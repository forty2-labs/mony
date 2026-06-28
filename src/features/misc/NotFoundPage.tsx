import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="grid place-items-center py-24 text-center">
      <div>
        <p className="text-5xl font-semibold tracking-tight text-content-muted">404</p>
        <p className="mt-2 text-sm text-content-muted">This page doesn't exist.</p>
        <Link to="/" className="btn-primary mt-5 inline-flex">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
