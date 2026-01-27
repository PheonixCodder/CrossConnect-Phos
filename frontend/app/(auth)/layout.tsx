import React, { ReactNode } from "react";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full flex justify-center">
        {children}
      </div>
    </div>
  );
};

export default Layout;
