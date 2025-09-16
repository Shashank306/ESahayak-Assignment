import { format } from 'date-fns';

interface BuyerHistoryProps {
  history: Array<{
    id: string;
    changedAt: Date;
    diff: Record<string, { old: unknown; new: unknown }>;
    changedBy: {
      fullName: string | null;
    } | null;
  }>;
}

export default function BuyerHistory({ history }: BuyerHistoryProps) {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Changes</h3>
      </div>
      <div className="px-6 py-4">
        <div className="flow-root">
          <ul className="-mb-8">
            {history.map((item, index) => (
              <li key={item.id}>
                <div className="relative pb-8">
                  {index !== history.length - 1 && (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white">
                        <svg
                          className="h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <div className="text-sm text-gray-500">
                          {Object.entries(item.diff).map(([field, change]) => (
                            <div key={field} className="mb-1">
                              <span className="font-medium text-gray-900">
                                {field === 'created' ? 'Created buyer' : 
                                 field === 'updated' ? 'Updated buyer' :
                                 field.charAt(0).toUpperCase() + field.slice(1)}
                              </span>
                              {field !== 'created' && field !== 'updated' && (
                                <span className="text-gray-500">
                                  {' '}from{' '}
                                  <span className="font-mono text-xs bg-gray-100 px-1 rounded">
                                    {change.old === null ? 'null' : String(change.old)}
                                  </span>
                                  {' '}to{' '}
                                  <span className="font-mono text-xs bg-gray-100 px-1 rounded">
                                    {change.new === null ? 'null' : String(change.new)}
                                  </span>
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        <div>
                          {format(new Date(item.changedAt), 'MMM d, yyyy')}
                        </div>
                        <div className="text-xs">
                          {format(new Date(item.changedAt), 'h:mm a')}
                        </div>
                        {item.changedBy?.fullName && (
                          <div className="text-xs text-gray-400">
                            by {item.changedBy.fullName}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
