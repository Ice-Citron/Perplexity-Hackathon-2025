import React from 'react';

function CoverageMeter({ coverage, size = 'normal' }) {
  const { left = 33, center = 34, right = 33 } = coverage || {};

  const isSmall = size === 'small';

  return (
    <div className={isSmall ? '' : 'space-y-2'}>
      {!isSmall && (
        <div className="flex justify-between text-xs text-gray-600 font-medium">
          <span>Political Coverage Balance</span>
        </div>
      )}

      <div className="flex w-full h-2 rounded-full overflow-hidden">
        <div
          className="bg-blue-500"
          style={{ width: `${left}%` }}
          title={`Left: ${left}%`}
        />
        <div
          className="bg-gray-400"
          style={{ width: `${center}%` }}
          title={`Center: ${center}%`}
        />
        <div
          className="bg-red-500"
          style={{ width: `${right}%` }}
          title={`Right: ${right}%`}
        />
      </div>

      {!isSmall && (
        <div className="flex justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            Left {left}%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-gray-400"></span>
            Center {center}%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            Right {right}%
          </span>
        </div>
      )}
    </div>
  );
}

export default CoverageMeter;
