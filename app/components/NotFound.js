import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import Page from "./Page";
function NotFound() {
  return (
    <Page title="Not Found">
      <div className="text-center">
        <h2>Whoops we cant find that page</h2>
        <p className="lead text-muted">
          Vist the home page <Link to="/">homepage</Link>
        </p>
      </div>
    </Page>
  );
}

export default NotFound;
