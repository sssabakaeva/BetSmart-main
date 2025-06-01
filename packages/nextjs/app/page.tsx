"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import type { NextPage } from "next";
import { useAccount, useWalletClient } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import VotingContractJSON from "~~/public/VotingContract.json";

const VOTING_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const VotingContractABI = VotingContractJSON.abi;

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    if (walletClient) {
      const provider = new ethers.providers.Web3Provider(walletClient as unknown as ethers.providers.ExternalProvider);
      const signer = provider.getSigner();
      const contractInstance = new ethers.Contract(VOTING_CONTRACT_ADDRESS, VotingContractABI, signer);
      setContract(contractInstance);
    }
  }, [walletClient]);

  const createVotingSession = async () => {
    if (!contract) {
      console.error("Contract not initialized");
      return;
    }

    const description = "Election 2024";
    const candidates = ["Candidate 1", "Candidate 2"];
    const startTime = Math.floor(Date.now() / 1000);
    const endTime = startTime + 3600;

    try {
      const tx = await contract.createVotingSession(description, candidates, startTime, endTime, { gasLimit: 500000 });
      await tx.wait();
      alert("Voting session created successfully!");
      loadSessions();
    } catch (error) {
      console.error("Error creating voting session:", error);
    }
  };

  const checkVotingSession = async (sessionId: number) => {
    if (!contract) {
      console.error("Contract not initialized");
      return;
    }

    try {
      const session = await contract.votingSessions(sessionId);
      console.log("Session Details:", session);
    } catch (error) {
      console.error("Error fetching session details:", error);
    }
  };

  const vote = async (sessionId: number, candidateIndex: number) => {
    if (!contract) {
      console.error("Contract not initialized");
      return;
    }
    try {
      const tx = await contract.vote(sessionId, candidateIndex);
      await tx.wait();
      alert("Vote cast successfully!");
    } catch (error) {
      console.error("Error while voting:", error);
    }
  };

  const loadSessions = async () => {
    if (!contract) return;

    const sessionCount = await contract.votingSessionCount();
    const loadedSessions = [];

    for (let i = 0; i < sessionCount; i++) {
      try {
        const session = await contract.votingSessions(i);
        loadedSessions.push({
          id: i,
          description: session.description,
          startTime: session.startTime.toString(),
          endTime: session.endTime.toString(),
          exists: session.exists,
        });
      } catch (error) {
        console.error(`Error fetching session ${i}:`, error);
      }
    }

    setSessions(loadedSessions);
  };

  useEffect(() => {
    loadSessions();
  }, [contract]);

  const transferOwnership = async (newOwner: string) => {
    if (!contract) {
      console.error("Contract is not initialized");
      return;
    }

    if (!ethers.utils.isAddress(newOwner)) {
      console.error("Invalid Ethereum address");
      return;
    }

    try {
      const tx = await contract.transferOwnership(newOwner, { gasLimit: 20000 });
      await tx.wait();
      console.log("Ownership transferred successfully");
    } catch (error) {
      console.error("Error transferring ownership:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <header className="bg-blue-600 text-white py-4 shadow-md">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center">Приложение для Голосования</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <section className="mb-8 text-center">
            <p className="text-lg font-medium">Подключённый Адресс Кошелька:</p>
            <Address address={connectedAddress} />
          </section>
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Существующие Сессии Голосования</h2>
          {sessions.length === 0 ? (
            <p className="text-gray-500">Сеансы недоступны.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessions.map(session => (
                <div key={session.id} className="bg-white shadow-md rounded-lg p-4">
                  <p>
                    <strong>Session ID:</strong> {session.id}
                  </p>
                  <p>
                    <strong>Description:</strong> {session.description}
                  </p>
                  <p>
                    <strong>Start Time:</strong> {new Date(parseInt(session.startTime) * 1000).toLocaleString()}
                  </p>
                  <p>
                    <strong>End Time:</strong> {new Date(parseInt(session.endTime) * 1000).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="text-center space-y-4 flex flex-col">
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-blue-700"
            onClick={createVotingSession}
          >
            Создать сессию голосования
          </button>
          <button
            className="bg-green-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-green-700"
            onClick={() => checkVotingSession(0)}
          >
            Проверить Первую Сессию
          </button>
          <button
            className="bg-purple-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-purple-700"
            onClick={() => vote(1, 0)}
          >
            Проголосовать за кандидата 1
          </button>
          <button
            className="bg-purple-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-purple-700 "
            onClick={() => vote(1, 1)}
          >
            Проголосовать за кандидата 2
          </button>
          <button
            className="bg-red-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-red-700"
            onClick={() => transferOwnership("0xe848F62De65caFB93D36205E206A08c4db7EcEbE")}
          >
            Передать право владения
          </button>
        </section>
      </main>
    </div>
  );
};

export default Home;
