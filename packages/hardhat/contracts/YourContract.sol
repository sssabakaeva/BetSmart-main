// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract VotingContract {
    struct Candidate {
        string name;
        uint256 voteCount;
    }

    struct VotingSession {
        string description;
        uint256 startTime;
        uint256 endTime;
        mapping(address => bool) hasVoted;
        Candidate[] candidates;
        bool exists;
        bool isClosed;
    }

    address public owner;
    uint256 public votingSessionCount = 0;
    mapping(uint256 => VotingSession) public votingSessions;

    modifier isOwner() {
        require(msg.sender == owner, "Not the Owner");
        _;
    }

    modifier sessionExists(uint256 sessionId) {
        require(votingSessions[sessionId].exists, "Voting session does not exist");
        _;
    }

    modifier withinVotingPeriod(uint256 sessionId) {
        require(
            block.timestamp >= votingSessions[sessionId].startTime &&
            block.timestamp <= votingSessions[sessionId].endTime,
            "Voting is not active"
        );
        _;
    }

    modifier hasNotVoted(uint256 sessionId) {
        require(!votingSessions[sessionId].hasVoted[msg.sender], "You have already voted");
        _;
    }

    modifier isNotClosed(uint256 sessionId) {
        require(!votingSessions[sessionId].isClosed, "Voting session is closed");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    event VotingSessionCreated(uint256 indexed sessionId, string description, uint256 startTime, uint256 endTime);
    event VoteCast(uint256 indexed sessionId, address indexed voter, uint256 candidateIndex);
    event VotingSessionClosed(uint256 indexed sessionId);
    event VotingSessionDeleted(uint256 indexed sessionId);

    function getOwner() public view returns (address) {
        return owner;
    }

    function transferOwnership(address newOwner) public isOwner {
        require(newOwner != address(0), "New owner is the zero address");
        owner = newOwner;
    }

    function createVotingSession(
        string memory _description,
        string[] memory _candidateNames,
        uint256 _startTime,
        uint256 _endTime
    ) public isOwner {
        require(_startTime < _endTime, "Invalid time period");

        VotingSession storage newSession = votingSessions[votingSessionCount];
        newSession.description = _description;
        newSession.startTime = _startTime;
        newSession.endTime = _endTime;
        newSession.exists = true;
        newSession.isClosed = false;

        for (uint256 i = 0; i < _candidateNames.length; i++) {
            newSession.candidates.push(Candidate({name: _candidateNames[i], voteCount: 0}));
        }

        emit VotingSessionCreated(votingSessionCount, _description, _startTime, _endTime);
        votingSessionCount++;
    }

    function vote(uint256 sessionId, uint256 candidateIndex)
        public
        sessionExists(sessionId)
        withinVotingPeriod(sessionId)
        hasNotVoted(sessionId)
        isNotClosed(sessionId)
    {
        VotingSession storage session = votingSessions[sessionId];

        require(candidateIndex < session.candidates.length, "Invalid candidate index");

        session.candidates[candidateIndex].voteCount++;
        session.hasVoted[msg.sender] = true;

        emit VoteCast(sessionId, msg.sender, candidateIndex);
    }

    function getResults(uint256 sessionId)
        public
        view
        sessionExists(sessionId)
        returns (string[] memory, uint256[] memory)
    {
        VotingSession storage session = votingSessions[sessionId];
        uint256 candidateCount = session.candidates.length;

        string[] memory names = new string[](candidateCount);
        uint256[] memory votes = new uint256[](candidateCount);

        for (uint256 i = 0; i < candidateCount; i++) {
            names[i] = session.candidates[i].name;
            votes[i] = session.candidates[i].voteCount;
        }

        return (names, votes);
    }

    function closeVotingSession(uint256 sessionId)
        public
        isOwner
        sessionExists(sessionId)
    {
        VotingSession storage session = votingSessions[sessionId];
        require(!session.isClosed, "Voting session is already closed");

        session.isClosed = true;
        emit VotingSessionClosed(sessionId);
    }

    function deleteVotingSession(uint256 sessionId)
        public
        isOwner
        sessionExists(sessionId)
    {
        delete votingSessions[sessionId];
        emit VotingSessionDeleted(sessionId);
    }
}
