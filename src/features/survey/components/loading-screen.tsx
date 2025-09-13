interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({
  message = "맞춤형 설문을 생성하고 있습니다",
}: LoadingScreenProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-blue-50 items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-4">{message}</h2>
        <p className="text-gray-600 mb-6">잠시만 기다려주세요...</p>

        <div className="loading-dots text-center">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
}
