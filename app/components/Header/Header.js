"use client";

import { useState } from "react";
import { InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">Wheatherly</h1>
              <span className="ml-4 text-white/60">by Tejas Saraf</span>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors"
            >
              <InformationCircleIcon className="h-5 w-5 mr-2" />
              About PM Accelerator
            </button>
          </div>
        </div>
      </header>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-white">Product Manager Accelerator</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-white/60 hover:text-white"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6 text-white/80">
                <p>
                  The Product Manager Accelerator Program is designed to support PM professionals through every stage of their careers. From students looking for entry-level jobs to Directors looking to take on a leadership role, our program has helped over hundreds of students fulfill their career aspirations.
                </p>

                <p>
                  Our Product Manager Accelerator community are ambitious and committed. Through our program they have learnt, honed and developed new PM and leadership skills, giving them a strong foundation for their future endeavors.
                </p>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white">Our Services:</h3>
                  
                  <div className="space-y-3">
                    <div className="bg-white/5 p-4 rounded-lg">
                      <h4 className="font-semibold text-white">🚀 PMA Pro</h4>
                      <p className="mt-1">End-to-end product manager job hunting program that helps you master FAANG-level Product Management skills, conduct unlimited mock interviews, and gain job referrals through our largest alumni network. 25% of our offers came from tier 1 companies and get paid as high as $800K/year.</p>
                    </div>

                    <div className="bg-white/5 p-4 rounded-lg">
                      <h4 className="font-semibold text-white">🚀 AI PM Bootcamp</h4>
                      <p className="mt-1">Gain hands-on AI Product Management skills by building a real-life AI product with a team of AI Engineers, data scientists, and designers. We will also help you launch your product with real user engagement using our 100,000+ PM community and social media channels.</p>
                    </div>

                    <div className="bg-white/5 p-4 rounded-lg">
                      <h4 className="font-semibold text-white">🚀 PMA Power Skills</h4>
                      <p className="mt-1">Designed for existing product managers to sharpen their product management skills, leadership skills, and executive presentation skills.</p>
                    </div>

                    <div className="bg-white/5 p-4 rounded-lg">
                      <h4 className="font-semibold text-white">🚀 PMA Leader</h4>
                      <p className="mt-1">We help you accelerate your product management career, get promoted to Director and product executive levels, and win in the board room.</p>
                    </div>

                    <div className="bg-white/5 p-4 rounded-lg">
                      <h4 className="font-semibold text-white">🚀 1:1 Resume Review</h4>
                      <p className="mt-1">We help you rewrite your killer product manager resume to stand out from the crowd, with an interview guarantee. Get started by using our FREE killer PM resume template used by over 14,000 product managers.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white">Free Resources:</h3>
                  <p>We also published over 500+ free training and courses. Please visit our YouTube channel and Instagram to start learning for free today.</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white">Contact Information:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold">Website</p>
                      <a href="https://www.pmaccelerator.io/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                        www.pmaccelerator.io
                      </a>
                    </div>
                    <div>
                      <p className="font-semibold">Phone</p>
                      <a href="tel:+19548891063" className="text-blue-400 hover:text-blue-300">
                        +1 (954) 889-1063
                      </a>
                    </div>
                    <div>
                      <p className="font-semibold">Location</p>
                      <p>Boston, MA</p>
                    </div>
                    <div>
                      <p className="font-semibold">Founded</p>
                      <p>2020</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center space-x-4 pt-4">
                  <a
                    href="https://www.youtube.com/c/drnancyli"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    YouTube Channel
                  </a>
                  <a
                    href="https://www.instagram.com/drnancyli"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Instagram
                  </a>
                  <a
                    href="https://www.drnancyli.com/pmresume"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Free PM Resume Template
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 