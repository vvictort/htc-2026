import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import VoiceRecorder from "../components/onboarding/VoiceRecorder";
import VoiceSelector from "../components/onboarding/VoiceSelector";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [voiceMethod, setVoiceMethod] = useState<"clone" | "preset" | null>(null);
  const [notificationMethod, setNotificationMethod] = useState<string[]>([]);

  const handleNext = () => {
    if (step === 3) {
      // Save all data and redirect
      navigate("/dashboard");
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-warm-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-card shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-screen md:min-h-[600px] lg:min-h-[700px]">
        {/* Left Panel - Progress/Info */}
        <div className="bg-coral/10 p-6 md:p-8 md:w-1/3 flex flex-col justify-between border-b md:border-b-0 md:border-r border-warm-cream">
          <div>
            <div className="text-3xl md:text-4xl mb-4 md:mb-6">👶</div>
            <h1 className="text-xl md:text-2xl font-extrabold text-charcoal mb-2">Welcome to BabyWatcher!</h1>
            <p className="text-mid-gray text-xs md:text-sm">
              Let's get everything set up perfectly for you and your little one.
            </p>
          </div>

          <div className="space-y-4 md:space-y-6 hidden md:block">
            <StepIndicator current={step} number={1} title="Voice Setup" />
            <StepIndicator current={step} number={2} title="Voice Selection" />
            <StepIndicator current={step} number={3} title="Notifications" />
          </div>

          {/* Mobile Steps */}
          <div className="flex md:hidden gap-2 mt-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-2 rounded-full flex-1 transition-colors ${i <= step ? "bg-coral" : "bg-warm-cream"}`}
              />
            ))}
          </div>

          <div className="text-xs text-mid-gray/50 mt-4 md:mt-0">Step {step} of 3</div>
        </div>

        {/* Right Panel - Content */}
        <div className="p-6 md:p-8 md:w-2/3 flex flex-col">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full flex flex-col justify-center">
                  <h2 className="text-2xl font-bold text-charcoal mb-6">How should the AI sound?</h2>
                  <div className="grid grid-cols-1 gap-4">
                    <button
                      onClick={() => {
                        setVoiceMethod("clone");
                        handleNext();
                      }}
                      className="p-6 rounded-2xl border-2 border-warm-cream hover:border-coral hover:bg-coral/5 transition-all text-left flex items-start gap-4 group">
                      <span className="text-3xl bg-white p-2 rounded-lg shadow-sm">🎤</span>
                      <div>
                        <h3 className="font-bold text-charcoal group-hover:text-coral transition-colors">
                          Clone My Voice
                        </h3>
                        <p className="text-sm text-mid-gray mt-1">
                          Record a short sample so the AI sounds just like you. Perfect for comforting your baby.
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setVoiceMethod("preset");
                        handleNext();
                      }}
                      className="p-6 rounded-2xl border-2 border-warm-cream hover:border-soft-blue hover:bg-soft-blue/5 transition-all text-left flex items-start gap-4 group">
                      <span className="text-3xl bg-white p-2 rounded-lg shadow-sm">🤖</span>
                      <div>
                        <h3 className="font-bold text-charcoal group-hover:text-soft-blue transition-colors">
                          Choose a Preset
                        </h3>
                        <p className="text-sm text-mid-gray mt-1">
                          Select from our library of soothing, friendly voices designed for children.
                        </p>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}>
                  <button onClick={handleBack} className="text-sm text-mid-gray hover:text-charcoal mb-4">
                    ← Back
                  </button>
                  <h2 className="text-2xl font-bold text-charcoal mb-2">
                    {voiceMethod === "clone" ? "Record Your Voice" : "Select a Voice"}
                  </h2>
                  <p className="text-mid-gray text-sm mb-6">
                    {voiceMethod === "clone"
                      ? "Read the phrase below clearly. We'll use this to create your custom voice."
                      : "Listen to the samples and pick the one you find most soothing."}
                  </p>

                  {voiceMethod === "clone" ? (
                    <VoiceRecorder onComplete={() => {}} />
                  ) : (
                    <VoiceSelector onSelect={() => {}} />
                  )}
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}>
                  <button onClick={handleBack} className="text-sm text-mid-gray hover:text-charcoal mb-4">
                    ← Back
                  </button>
                  <h2 className="text-2xl font-bold text-charcoal mb-6">Stay Updated</h2>
                  <p className="text-mid-gray text-sm mb-8">
                    How would you like to receive alerts when your baby needs you?
                  </p>

                  <div className="space-y-4">
                    {["Push Notifications", "Email Alerts", "SMS Messages"].map((method) => (
                      <label
                        key={method}
                        className="flex items-center gap-4 p-4 rounded-xl border border-warm-cream cursor-pointer hover:bg-warm-white transition-colors">
                        <input
                          type="checkbox"
                          className="w-5 h-5 text-coral rounded focus:ring-coral"
                          checked={notificationMethod.includes(method)}
                          onChange={(e) => {
                            if (e.target.checked) setNotificationMethod([...notificationMethod, method]);
                            else setNotificationMethod(notificationMethod.filter((m) => m !== method));
                          }}
                        />
                        <span className="font-semibold text-charcoal">{method}</span>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Navigation (only for steps > 1) */}
          {step > 1 && (
            <div className="mt-8 pt-6 border-t border-warm-cream flex justify-end">
              <button onClick={handleNext} className="btn-primary">
                {step === 3 ? "Finish Setup" : "Continue"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ current, number, title }: { current: number; number: number; title: string }) {
  const isActive = current === number;
  const isCompleted = current > number;

  return (
    <div className={`flex items-center gap-3 ${isActive ? "opacity-100" : "opacity-50"}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
          isActive ? "bg-coral text-white" : isCompleted ? "bg-green-500 text-white" : "bg-white text-mid-gray"
        }`}>
        {isCompleted ? "✓" : number}
      </div>
      <span className={`font-semibold ${isActive ? "text-charcoal" : "text-mid-gray"}`}>{title}</span>
    </div>
  );
}
