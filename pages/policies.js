import { useEffect } from "react";

export default function PoliciesRedirect() {
  useEffect(() => {
    window.location.replace("/#policies");
  }, []);

  return (
    <main style={{ fontFamily: "Arial, sans-serif", padding: 40 }}>
      <h1>Redirecting to Policies...</h1>
      <p>
        If you are not redirected automatically, <a href="/#policies">open Policies here</a>.
      </p>
    </main>
  );
}
