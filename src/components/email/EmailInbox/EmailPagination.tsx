interface EmailPaginationProps {
  currentPage: number;
  totalEmails: number;
  emailsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function EmailPagination({
  currentPage,
  totalEmails,
  emailsPerPage,
  onPageChange
}: EmailPaginationProps) {
  const totalPages = Math.ceil(totalEmails / emailsPerPage);
  const startIndex = (currentPage - 1) * emailsPerPage + 1;
  const endIndex = Math.min(currentPage * emailsPerPage, totalEmails);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className="sticky bottom-0 flex items-center rounded-b-2xl justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-[#171f2f]">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Showing {startIndex}-{endIndex} of {totalEmails}
      </p>
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-white/[0.03]"
        >
          <svg
            className="stroke-current"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12.7083 5L7.5 10.2083L12.7083 15.4167"
              stroke=""
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-white/[0.03]"
        >
          <svg
            className="stroke-current"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7.29167 15.8335L12.5 10.6252L7.29167 5.41683"
              stroke=""
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
