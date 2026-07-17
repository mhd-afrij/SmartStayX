// Title — Reusable section title with optional kicker, subtitle, and alignment
import React from 'react';

const Title = ({ font, title, subtitle, align = 'center', kicker }) => {
  return (
    <div className={`flex flex-col justify-center ${align === 'left' ? 'items-start text-left' : 'items-center text-center'}`}>
      {kicker && <p className="luxury-kicker mb-4">{kicker}</p>}
      <h2 className={`${font || 'font-playfair'} luxury-title max-w-4xl`}>
        {title}
      </h2>
      {subtitle && <p className="luxury-copy mt-4 max-w-3xl">{subtitle}</p>}
    </div>
  );
};

export default Title;