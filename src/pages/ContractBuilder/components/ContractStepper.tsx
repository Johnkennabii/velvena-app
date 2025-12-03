interface Step {
  id: number;
  label: string;
  icon: string;
  description: string;
}

interface ContractStepperProps {
  currentStep: number;
  steps: Step[];
}

export default function ContractStepper({ currentStep, steps }: ContractStepperProps) {
  return (
    <div className="mb-8">
      <div className="relative">
        {/* Progress bar */}
        <div className="absolute left-0 top-5 h-0.5 w-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <div key={step.id} className="flex flex-col items-center" style={{ flex: 1 }}>
                {/* Step circle */}
                <div
                  className={`
                    relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2
                    transition-all duration-300
                    ${
                      isCompleted
                        ? "border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-500/50"
                        : isCurrent
                          ? "border-blue-500 bg-white text-blue-500 shadow-lg dark:bg-gray-900"
                          : "border-gray-300 bg-white text-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-500"
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </div>

                {/* Step label */}
                <div className="mt-3 text-center">
                  <p
                    className={`
                      text-sm font-medium transition-colors
                      ${isCurrent ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"}
                    `}
                  >
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-500">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
