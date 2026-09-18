import bcrypt from 'bcryptjs';
import { Exam, Subject, Topic, Question, Test, User } from '../src/types';

export const INITIAL_EXAMS: Exam[] = [
  { id: 'exam-computer-science', name: 'Computer Science', description: 'Core computer science subjects and technical entrance preparation.', createdAt: new Date().toISOString() },
  { id: 'exam-ca', name: 'CA', description: 'Chartered Accountancy preparation subjects.', createdAt: new Date().toISOString() },
  { id: 'exam-uppet', name: 'UPPET', description: 'UPPET preparation subjects and practice material.', createdAt: new Date().toISOString() }
];

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'subj-dbms',
    examId: 'exam-computer-science',
    name: 'Database Management Systems (DBMS)',
    description: 'Relational models, SQL queries, normalization theories, transaction management, and indexing mechanisms.',
    icon: 'Database',
    createdAt: new Date().toISOString()
  },
  {
    id: 'subj-dsa',
    examId: 'exam-computer-science',
    name: 'Data Structures & Algorithms',
    description: 'Core linear and non-linear data structures, searching, sorting, graph traversals, and algorithmic complexity.',
    icon: 'Binary',
    createdAt: new Date().toISOString()
  },
  {
    id: 'subj-os',
    examId: 'exam-computer-science',
    name: 'Operating Systems',
    description: 'Process lifecycle, thread concurrency, synchronization primitives, virtual memory, and deadlock handling.',
    icon: 'Cpu',
    createdAt: new Date().toISOString()
  },
  {
    id: 'subj-cn',
    examId: 'exam-computer-science',
    name: 'Computer Networks',
    description: 'OSI and TCP/IP protocol suites, IP subnetting, transport layer flow control, and routing algorithms.',
    icon: 'Network',
    createdAt: new Date().toISOString()
  },
  {
    id: 'subj-se',
    examId: 'exam-computer-science',
    name: 'Software Engineering',
    description: 'Agile & Waterfall SDLC, clean architecture design patterns, testing strategies, and software quality metrics.',
    icon: 'Code2',
    createdAt: new Date().toISOString()
  },
  {
    id: 'subj-ca-accounting',
    examId: 'exam-ca',
    name: 'Accounting',
    description: 'Accounting fundamentals, financial statements, and standards for CA preparation.',
    icon: 'Calculator',
    createdAt: new Date().toISOString()
  },
  {
    id: 'subj-ca-taxation',
    examId: 'exam-ca',
    name: 'Taxation',
    description: 'Income tax and indirect tax concepts for CA preparation.',
    icon: 'ReceiptText',
    createdAt: new Date().toISOString()
  },
  {
    id: 'subj-uppet-general-studies',
    examId: 'exam-uppet',
    name: 'General Studies',
    description: 'General knowledge, current affairs, and state-focused studies for UPPET.',
    icon: 'Globe2',
    createdAt: new Date().toISOString()
  },
  {
    id: 'subj-uppet-reasoning',
    examId: 'exam-uppet',
    name: 'Reasoning',
    description: 'Verbal and non-verbal reasoning practice for UPPET.',
    icon: 'BrainCircuit',
    createdAt: new Date().toISOString()
  },
  {
    id: 'subj-uppet-paper-mock',
    examId: 'exam-uppet',
    name: 'Paper Mock',
    description: 'Seven full-length UPPET paper mocks with 100 questions each.',
    icon: 'FileCheck2',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_TOPICS: Topic[] = [
  // DBMS
  { id: 'top-dbms-norm', subjectId: 'subj-dbms', name: 'Normalization', description: 'Functional dependencies, 1NF, 2NF, 3NF, BCNF, and lossless join decomposition.' },
  { id: 'top-dbms-join', subjectId: 'subj-dbms', name: 'SQL JOIN', description: 'Inner, Left Outer, Right Outer, Full Outer joins, cross products, and set operations.' },
  { id: 'top-dbms-tx', subjectId: 'subj-dbms', name: 'Transactions', description: 'ACID properties, serializability, conflict serializability, two-phase locking (2PL).' },
  { id: 'top-dbms-idx', subjectId: 'subj-dbms', name: 'Indexing', description: 'B-Trees, B+ Trees, clustered vs unclustered indices, and query optimization.' },

  // DSA
  { id: 'top-dsa-trees', subjectId: 'subj-dsa', name: 'Binary Trees & BST', description: 'Tree traversals, binary search tree operations, AVL balance factors, and height calculations.' },
  { id: 'top-dsa-graphs', subjectId: 'subj-dsa', name: 'Graphs & Traversals', description: 'Breadth-First Search (BFS), Depth-First Search (DFS), topological sorting, and Dijkstra.' },
  { id: 'top-dsa-sort', subjectId: 'subj-dsa', name: 'Sorting Algorithms', description: 'MergeSort, QuickSort, HeapSort time and space complexities, and stability.' },

  // OS
  { id: 'top-os-sync', subjectId: 'subj-dbms', name: 'Process Synchronization', description: 'Critical section problem, semaphores, mutexes, monitors, and Peterson solution.' },
  { id: 'top-os-mem', subjectId: 'subj-os', name: 'Virtual Memory', description: 'Paging, page replacement algorithms (FIFO, LRU, Optimal), TLB, and thrashing.' },
  { id: 'top-os-deadlock', subjectId: 'subj-os', name: 'Deadlocks', description: 'Four Coffman conditions, resource allocation graphs, Banker algorithm, and recovery.' },

  // CN
  { id: 'top-cn-tcp', subjectId: 'subj-cn', name: 'TCP/IP & Transport', description: 'Three-way handshake, congestion control (slow start, AIMD), UDP vs TCP headers.' },
  { id: 'top-cn-subnet', subjectId: 'subj-cn', name: 'Subnetting & Addressing', description: 'IPv4 CIDR notation, subnet masks, network vs broadcast addresses, and supernetting.' },
  { id: 'top-cn-route', subjectId: 'subj-cn', name: 'Routing Protocols', description: 'Distance vector (RIP), link state (OSPF), BGP exterior routing, and count-to-infinity.' },

  // SE
  { id: 'top-se-agile', subjectId: 'subj-se', name: 'Agile & Scrum', description: 'Sprint cycles, backlog grooming, daily standups, burn-down charts, and agile manifesto.' },
  { id: 'top-se-patterns', subjectId: 'subj-se', name: 'Design Patterns', description: 'Creational (Singleton, Factory), Structural (Adapter, Decorator), and Behavioral (Observer) patterns.' }
];

export const UPPET_REASONING_TOPICS: Topic[] = [
  { id: 'top-uppet-reasoning-analogy', subjectId: 'subj-uppet-reasoning', name: 'Analogy', description: 'Word, number, and relationship analogies.' },
  { id: 'top-uppet-reasoning-classification', subjectId: 'subj-uppet-reasoning', name: 'Classification', description: 'Find the odd word, number, pair, or shape.' },
  { id: 'top-uppet-reasoning-number-series', subjectId: 'subj-uppet-reasoning', name: 'Number Series', description: 'Identify number patterns and missing terms.' },
  { id: 'top-uppet-reasoning-alphabet-series', subjectId: 'subj-uppet-reasoning', name: 'Alphabet Series', description: 'Identify patterns in alphabet sequences.' },
  { id: 'top-uppet-reasoning-coding', subjectId: 'subj-uppet-reasoning', name: 'Coding-Decoding', description: 'Decode words using alphabet transformations.' },
  { id: 'top-uppet-reasoning-blood-relations', subjectId: 'subj-uppet-reasoning', name: 'Blood Relations', description: 'Solve family relationship problems.' },
  { id: 'top-uppet-reasoning-direction', subjectId: 'subj-uppet-reasoning', name: 'Direction Sense', description: 'Track movement and final directions.' },
  { id: 'top-uppet-reasoning-ranking', subjectId: 'subj-uppet-reasoning', name: 'Ranking and Order', description: 'Calculate positions in rows and rankings.' },
  { id: 'top-uppet-reasoning-syllogism', subjectId: 'subj-uppet-reasoning', name: 'Syllogism', description: 'Evaluate statements and logical conclusions.' },
  { id: 'top-uppet-reasoning-venn', subjectId: 'subj-uppet-reasoning', name: 'Venn Diagram', description: 'Identify relationships among groups.' },
  { id: 'top-uppet-reasoning-operations', subjectId: 'subj-uppet-reasoning', name: 'Mathematical Operations', description: 'Solve questions with substituted operators.' },
  { id: 'top-uppet-reasoning-calendar', subjectId: 'subj-uppet-reasoning', name: 'Calendar', description: 'Calculate days and dates.' },
  { id: 'top-uppet-reasoning-clock', subjectId: 'subj-uppet-reasoning', name: 'Clock', description: 'Calculate angles between clock hands.' },
  { id: 'top-uppet-reasoning-statement-conclusion', subjectId: 'subj-uppet-reasoning', name: 'Statement and Conclusion', description: 'Identify conclusions supported by statements.' },
  { id: 'top-uppet-reasoning-assumption', subjectId: 'subj-uppet-reasoning', name: 'Statement and Assumption', description: 'Identify implicit assumptions.' },
  { id: 'top-uppet-reasoning-missing-number', subjectId: 'subj-uppet-reasoning', name: 'Missing Number', description: 'Find values missing from number patterns.' },
  { id: 'top-uppet-reasoning-seating', subjectId: 'subj-uppet-reasoning', name: 'Seating Arrangement', description: 'Arrange people using positional clues.' },
  { id: 'top-uppet-reasoning-data-sufficiency', subjectId: 'subj-uppet-reasoning', name: 'Data Sufficiency', description: 'Determine whether statements provide enough data.' },
  { id: 'top-uppet-reasoning-mirror', subjectId: 'subj-uppet-reasoning', name: 'Mirror Image', description: 'Reason about mirror transformations.' },
  { id: 'top-uppet-reasoning-sequence', subjectId: 'subj-uppet-reasoning', name: 'Logical Sequence', description: 'Arrange events in logical order.' }
];

export const UPPET_GENERAL_STUDIES_TOPICS: Topic[] = [
  { id: 'top-uppet-gs-ancient-history', subjectId: 'subj-uppet-general-studies', name: 'Ancient Indian History', description: 'Harappan civilization and the Maurya Empire.' },
  { id: 'top-uppet-gs-medieval-history', subjectId: 'subj-uppet-general-studies', name: 'Medieval Indian History', description: 'The Mughals and Sikhism.' },
  { id: 'top-uppet-gs-modern-history', subjectId: 'subj-uppet-general-studies', name: 'Modern Indian History', description: 'The freedom movement and British India.' },
  { id: 'top-uppet-gs-constitution', subjectId: 'subj-uppet-general-studies', name: 'Indian Constitution', description: 'Constitutional history and Fundamental Rights.' },
  { id: 'top-uppet-gs-polity', subjectId: 'subj-uppet-general-studies', name: 'Indian Polity', description: 'The Union executive and Parliament.' },
  { id: 'top-uppet-gs-geography', subjectId: 'subj-uppet-general-studies', name: 'Indian Geography', description: 'Rivers, soils, and mountain peaks of India.' },
  { id: 'top-uppet-gs-world-geography', subjectId: 'subj-uppet-general-studies', name: 'World Geography', description: 'Continents and oceans.' },
  { id: 'top-uppet-gs-economy', subjectId: 'subj-uppet-general-studies', name: 'Indian Economy', description: 'Monetary policy, GDP, and taxation.' },
  { id: 'top-uppet-gs-physics', subjectId: 'subj-uppet-general-studies', name: 'General Science - Physics', description: 'Force, current, and light.' },
  { id: 'top-uppet-gs-chemistry', subjectId: 'subj-uppet-general-studies', name: 'General Science - Chemistry', description: 'Chemical formulas, reactions, and pH.' },
  { id: 'top-uppet-gs-biology', subjectId: 'subj-uppet-general-studies', name: 'General Science - Biology', description: 'The human body and plant biology.' },
  { id: 'top-uppet-gs-environment', subjectId: 'subj-uppet-general-studies', name: 'Environment and Ecology', description: 'Climate, renewable energy, and conservation.' },
  { id: 'top-uppet-gs-up-gk', subjectId: 'subj-uppet-general-studies', name: 'Uttar Pradesh GK', description: 'Important places and facts about Uttar Pradesh.' },
  { id: 'top-uppet-gs-up-culture', subjectId: 'subj-uppet-general-studies', name: 'Uttar Pradesh History and Culture', description: 'Buddhist heritage and classical dance.' },
  { id: 'top-uppet-gs-art-culture', subjectId: 'subj-uppet-general-studies', name: 'Indian Art and Culture', description: 'Monuments and classical dance forms.' },
  { id: 'top-uppet-gs-symbols', subjectId: 'subj-uppet-general-studies', name: 'National Symbols', description: 'National symbols of India.' },
  { id: 'top-uppet-gs-books', subjectId: 'subj-uppet-general-studies', name: 'Books and Authors', description: 'Important Indian books and authors.' },
  { id: 'top-uppet-gs-sports', subjectId: 'subj-uppet-general-studies', name: 'Sports and Awards', description: 'Indian sporting honours and awards.' }
];

export const UPPET_PAPER_MOCK_TOPICS: Topic[] = [
  { id: 'top-uppet-paper-mock-mixed', subjectId: 'subj-uppet-paper-mock', name: 'Complete Paper', description: 'Mixed UPPET General Studies and Reasoning paper practice.' }
];

export const INITIAL_QUESTIONS: Question[] = [
  // DBMS - Normalization
  {
    id: 'q-norm-1',
    subjectId: 'subj-dbms',
    topicId: 'top-dbms-norm',
    question: 'A relational schema is in Boyce-Codd Normal Form (BCNF) if and only if for every non-trivial functional dependency X -> Y:',
    options: [
      'X is a superkey of the relation schema',
      'Y is a prime attribute belonging to a candidate key',
      'X is a foreign key referencing another relation',
      'The relation has no transitive dependencies'
    ],
    correctAnswer: 0,
    explanation: 'By formal definition, a relational schema R is in BCNF if for every non-trivial functional dependency X -> Y, X is a superkey of R. Unlike 3NF, BCNF does not allow the exemption where Y is a prime attribute.',
    difficulty: 'Easy',
    createdAt: new Date().toISOString()
  },
  {
    id: 'q-norm-2',
    subjectId: 'subj-dbms',
    topicId: 'top-dbms-norm',
    question: 'A relation R(A, B, C, D) has functional dependencies: A -> B, B -> C, and C -> D. In which normal form does this relation currently reside if A is the primary key?',
    options: [
      '1NF only',
      '2NF but not 3NF',
      '3NF but not BCNF',
      'BCNF'
    ],
    correctAnswer: 1,
    explanation: 'Since A is the single attribute key, there are no partial dependencies, so it is in 2NF. However, A -> B and B -> C cause transitive dependency of non-prime attribute C on key A via non-key B. Hence it violates 3NF.',
    difficulty: 'Medium',
    createdAt: new Date().toISOString()
  },
  {
    id: 'q-norm-3',
    subjectId: 'subj-dbms',
    topicId: 'top-dbms-norm',
    question: 'Given relation R(A, B, C, D, E) with FDs: {AB -> C, C -> D, D -> B, D -> E}. What is the minimal candidate key count and highest normal form?',
    options: [
      '2 Candidate Keys (AB, AD), 2NF',
      '3 Candidate Keys (AB, AC, AD), 3NF',
      '1 Candidate Key (AB), 1NF',
      '2 Candidate Keys (AB, CD), BCNF'
    ],
    correctAnswer: 1,
    explanation: 'Attributes E and C are determined by D, while D determines B. The candidate keys are AB, AC, and AD. In all dependencies, the right hand side is either a prime attribute or the left hand is a superkey, conforming to 3NF.',
    difficulty: 'Hard',
    createdAt: new Date().toISOString()
  },
  {
    id: 'q-norm-4',
    subjectId: 'subj-dbms',
    topicId: 'top-dbms-norm',
    question: 'Which of the following decomposition properties is guaranteed by 3NF synthesis algorithm that is NOT always guaranteed in BCNF decomposition?',
    options: [
      'Lossless join decomposition',
      'Dependency preservation',
      'Elimination of insertion anomalies',
      'Minimal redundant storage'
    ],
    correctAnswer: 1,
    explanation: 'It is always possible to find a 3NF decomposition that is both lossless and dependency preserving. For BCNF, lossless join is guaranteed, but dependency preservation cannot always be achieved without sacrificing BCNF.',
    difficulty: 'Medium',
    createdAt: new Date().toISOString()
  },

  // DBMS - SQL JOIN
  {
    id: 'q-join-1',
    subjectId: 'subj-dbms',
    topicId: 'top-dbms-join',
    question: 'Which SQL JOIN type returns all records from the left table, and matching records from the right table, substituting NULLs when no match is found?',
    options: [
      'INNER JOIN',
      'LEFT OUTER JOIN',
      'CROSS JOIN',
      'FULL OUTER JOIN'
    ],
    correctAnswer: 1,
    explanation: 'LEFT OUTER JOIN (or LEFT JOIN) keeps every tuple from the left table. If there is no corresponding row in the right table matching the join condition, NULL values are filled in for right table columns.',
    difficulty: 'Easy',
    createdAt: new Date().toISOString()
  },
  {
    id: 'q-join-2',
    subjectId: 'subj-dbms',
    topicId: 'top-dbms-join',
    question: 'If Table A has 5 rows (all containing the value 1) and Table B has 4 rows (all containing the value 1), how many rows will be returned by "SELECT * FROM A INNER JOIN B ON A.val = B.val"?',
    options: [
      '5 rows',
      '9 rows',
      '20 rows',
      '1 row'
    ],
    correctAnswer: 2,
    explanation: 'An INNER JOIN with a condition where every row matches matches all combinations. 5 rows in A each match 4 rows in B, resulting in a Cartesian product of 5 * 4 = 20 rows.',
    difficulty: 'Medium',
    createdAt: new Date().toISOString()
  },
  {
    id: 'q-join-3',
    subjectId: 'subj-dbms',
    topicId: 'top-dbms-join',
    question: 'When performing a join between a massive table (100 million rows) and an unindexed medium table (10,000 rows) in an RDBMS, which join algorithm does the query optimizer typically select?',
    options: [
      'Nested Loop Join',
      'Hash Join',
      'Sort-Merge Join with temporary table',
      'Broadcast Join'
    ],
    correctAnswer: 1,
    explanation: 'A Hash Join builds an in-memory hash table on the smaller relation (10,000 rows), then streams and probes rows from the massive table in a single sequential pass, offering O(N + M) complexity.',
    difficulty: 'Hard',
    createdAt: new Date().toISOString()
  },

  // DBMS - Transactions
  {
    id: 'q-tx-1',
    subjectId: 'subj-dbms',
    topicId: 'top-dbms-tx',
    question: 'Which property of ACID transactions guarantees that all operations within a transaction either succeed completely or are entirely rolled back?',
    options: [
      'Atomicity',
      'Consistency',
      'Isolation',
      'Durability'
    ],
    correctAnswer: 0,
    explanation: 'Atomicity ensures "all or nothing" execution. If any operation within a transaction aborts or fails, the database log rolls back any partial changes made by that transaction.',
    difficulty: 'Easy',
    createdAt: new Date().toISOString()
  },
  {
    id: 'q-tx-2',
    subjectId: 'subj-dbms',
    topicId: 'top-dbms-tx',
    question: 'In Strict Two-Phase Locking (Strict 2PL), when are exclusive (write) locks released by a transaction?',
    options: [
      'As soon as the shrinking phase begins',
      'Immediately after the write statement finishes',
      'Only after the transaction commits or aborts',
      'Whenever another transaction requests a shared lock'
    ],
    correctAnswer: 2,
    explanation: 'Strict 2PL requires that all exclusive locks held by a transaction be retained until the transaction terminates (commits or aborts). This prevents cascading rollbacks (cascadeless schedule).',
    difficulty: 'Medium',
    createdAt: new Date().toISOString()
  },
  {
    id: 'q-tx-3',
    subjectId: 'subj-dbms',
    topicId: 'top-dbms-tx',
    question: 'Consider schedule S: r1(X); r2(Y); r1(Y); w2(Y); w1(X). What is the serialization order and conflict serializability status?',
    options: [
      'Conflict serializable with order T1 -> T2',
      'Conflict serializable with order T2 -> T1',
      'Not conflict serializable due to cycle between T1 and T2',
      'View serializable only'
    ],
    correctAnswer: 2,
    explanation: 'In schedule S, r1(Y) precedes w2(Y) giving edge T1 -> T2 in precedence graph. Meanwhile r2(Y) and w2(Y) don\'t conflict directly on X, but let us inspect: w2(Y) conflicts with r1(Y) (T1 -> T2). There is a cycle depending on conflicts, rendering it non-conflict serializable.',
    difficulty: 'Hard',
    createdAt: new Date().toISOString()
  },

  // DBMS - Indexing
  {
    id: 'q-idx-1',
    subjectId: 'subj-dbms',
    topicId: 'top-dbms-idx',
    question: 'Why are B+ Trees predominantly preferred over standard B-Trees in relational database storage engines (e.g., InnoDB, PostgreSQL)?',
    options: [
      'B+ Trees store records only in internal nodes',
      'B+ Trees link leaf nodes sequentially, providing highly efficient range queries',
      'B+ Trees have an O(1) worst-case search time complexity',
      'B+ Trees require zero memory for node pointers'
    ],
    correctAnswer: 1,
    explanation: 'In a B+ Tree, all data records/pointers reside exclusively at the leaf nodes, which are linked together in a doubly-linked list. This enables rapid sequential range scans without traversing parent nodes.',
    difficulty: 'Easy',
    createdAt: new Date().toISOString()
  },
  {
    id: 'q-idx-2',
    subjectId: 'subj-dbms',
    topicId: 'top-dbms-idx',
    question: 'How many clustered indices can exist on a single table in a standard relational database?',
    options: [
      'Exactly one, because physical data rows can only be sorted in one order on disk',
      'Up to 16 clustered indices',
      'One per primary key and one per foreign key',
      'Unlimited, limited only by available disk space'
    ],
    correctAnswer: 0,
    explanation: 'A clustered index alters the physical storage order of the rows on disk. Since data rows can physically reside in only one sorted order, only ONE clustered index can exist per table.',
    difficulty: 'Medium',
    createdAt: new Date().toISOString()
  },

  // DSA - Binary Trees & BST
  {
    id: 'q-bst-1',
    subjectId: 'subj-dsa',
    topicId: 'top-dsa-trees',
    question: 'Which tree traversal algorithm visited nodes in ascending sorted order when applied to a Binary Search Tree (BST)?',
    options: [
      'Pre-order (Root -> Left -> Right)',
      'In-order (Left -> Root -> Right)',
      'Post-order (Left -> Right -> Root)',
      'Level-order (Breadth-First)'
    ],
    correctAnswer: 1,
    explanation: 'In-order traversal visits all nodes in the left subtree first (which are smaller than root), then visits the root node, then the right subtree (larger than root), naturally producing non-decreasing sorted order.',
    difficulty: 'Easy',
    createdAt: new Date().toISOString()
  },
  {
    id: 'q-bst-2',
    subjectId: 'subj-dsa',
    topicId: 'top-dsa-trees',
    question: 'What is the maximum number of nodes in a binary tree of height h (where a tree with single root node has height 0)?',
    options: [
      '2^(h+1) - 1',
      '2^h - 1',
      '2^(h-1)',
      'h^2 + 1'
    ],
    correctAnswer: 0,
    explanation: 'Level 0 has 2^0=1 node, level 1 has 2^1=2 nodes ... sum from i=0 to h of 2^i equals 2^(h+1) - 1.',
    difficulty: 'Medium',
    createdAt: new Date().toISOString()
  },
  {
    id: 'q-bst-3',
    subjectId: 'subj-dsa',
    topicId: 'top-dsa-trees',
    question: 'In an AVL Tree, after inserting a node causing an imbalance with balance factor +2 at node P, where P.left has balance factor -1, which rotation sequence restores balance?',
    options: [
      'Left rotation on P followed by Right rotation on P',
      'Left rotation on P.left followed by Right rotation on P (LR Rotation)',
      'Single Right rotation on P',
      'Double Right rotation on P'
    ],
    correctAnswer: 1,
    explanation: 'A Left-Right (LR) imbalance is resolved by first performing a Left rotation on the left child of P, converting the configuration into a Left-Left case, followed by a Right rotation on P.',
    difficulty: 'Hard',
    createdAt: new Date().toISOString()
  },

  // DSA - Graphs
  {
    id: 'q-graph-1',
    subjectId: 'subj-dsa',
    topicId: 'top-dsa-graphs',
    question: 'Which data structure is fundamentally used in Breadth-First Search (BFS) graph traversal to manage visited exploration frontiers?',
    options: [
      'Stack (LIFO)',
      'Queue (FIFO)',
      'Priority Queue (Min-Heap)',
      'Disjoint Set Union (DSU)'
    ],
    correctAnswer: 1,
    explanation: 'BFS explores vertices level by level in First-In-First-Out order, making a FIFO Queue the fundamental data structure for tracking nodes to explore.',
    difficulty: 'Easy',
    createdAt: new Date().toISOString()
  },
  {
    id: 'q-graph-2',
    subjectId: 'subj-dsa',
    topicId: 'top-dsa-graphs',
    question: 'What is the time complexity of Dijkstra shortest path algorithm when implemented with an adjacency list and binary min-heap for a graph with V vertices and E edges?',
    options: [
      'O(V^2)',
      'O((V + E) log V)',
      'O(V * E)',
      'O(E log E + V)'
    ],
    correctAnswer: 1,
    explanation: 'With an adjacency list and binary min-heap, extract-min is called V times (O(V log V)) and decrease-key is called at most E times (O(E log V)), yielding overall O((V + E) log V).',
    difficulty: 'Medium',
    createdAt: new Date().toISOString()
  },
  {
    id: 'q-graph-3',
    subjectId: 'subj-dsa',
    topicId: 'top-dsa-graphs',
    question: 'Which graph algorithm can identify negative weight cycles in a directed graph with time complexity O(V * E)?',
    options: [
      'Dijkstra Algorithm',
      'Bellman-Ford Algorithm',
      'Prim Minimum Spanning Tree',
      'Kruskal Algorithm'
    ],
    correctAnswer: 1,
    explanation: 'Bellman-Ford relaxes all E edges V-1 times. A subsequent V-th relaxation step that relaxes any edge confirms the presence of an reachable negative weight cycle.',
    difficulty: 'Hard',
    createdAt: new Date().toISOString()
  },

  // DSA - Sorting
  {
    id: 'q-sort-1',
    subjectId: 'subj-dsa',
    topicId: 'top-dsa-sort',
    question: 'What is the worst-case time complexity of QuickSort when pivot selection is consistently the smallest or largest element (e.g. naive pivot on sorted array)?',
    options: [
      'O(N log N)',
      'O(N)',
      'O(N^2)',
      'O(log N)'
    ],
    correctAnswer: 2,
    explanation: 'When unbalanced partitions occur (e.g., subproblems of size 0 and N-1), the recurrence relation becomes T(N) = T(N-1) + O(N), which sums to O(N^2).',
    difficulty: 'Easy',
    createdAt: new Date().toISOString()
  },
  {
    id: 'q-sort-2',
    subjectId: 'subj-dsa',
    topicId: 'top-dsa-sort',
    question: 'Which of the following sorting algorithms is inherently stable AND possesses an O(N log N) worst-case time complexity?',
    options: [
      'HeapSort',
      'QuickSort',
      'MergeSort',
      'SelectionSort'
    ],
    correctAnswer: 2,
    explanation: 'MergeSort guarantees O(N log N) in best, average, and worst cases, and preserves the relative order of duplicate keys (stability). HeapSort is not stable; QuickSort is O(N^2) in worst case.',
    difficulty: 'Medium',
    createdAt: new Date().toISOString()
  },

  // OS - Process Synchronization
  {
    id: 'q-os-sync-1',
    subjectId: 'subj-os',
    topicId: 'top-os-sync',
    question: 'What are the three essential requirements for any valid solution to the Critical Section Problem in operating systems?',
    options: [
      'Mutual Exclusion, Progress, and Bounded Waiting',
      'Atomicity, Consistency, and Durability',
      'Deadlock prevention, Memory protection, and Starvation avoidance',
      'Preemption, Aging, and Context Switching'
    ],
    correctAnswer: 0,
    explanation: 'A correct solution must satisfy: 1) Mutual Exclusion (only one process in critical section), 2) Progress (no deadlock when entering), and 3) Bounded Waiting (no starvation).',
    difficulty: 'Easy',
    createdAt: new Date().toISOString()
  },
  {
    id: 'q-os-sync-2',
    subjectId: 'subj-os',
    topicId: 'top-os-sync',
    question: 'A counting semaphore S is initialized to 10. Then 6 wait(S) operations and 4 signal(S) operations are executed in some order. What is the final value of S?',
    options: [
      '8',
      '12',
      '0',
      '10'
    ],
    correctAnswer: 0,
    explanation: 'Initial S = 10. Each wait(S) decrements S by 1: -6. Each signal(S) increments S by 1: +4. Final value = 10 - 6 + 4 = 8.',
    difficulty: 'Medium',
    createdAt: new Date().toISOString()
  },
  {
    id: 'q-os-sync-3',
    subjectId: 'subj-os',
    topicId: 'top-os-sync',
    question: 'In the Readers-Writers problem, what problem arises when priority is strictly given to readers?',
    options: [
      'Deadlock among readers',
      'Starvation of writer processes',
      'Violation of mutual exclusion among writers',
      'Priority inversion of kernel threads'
    ],
    correctAnswer: 1,
    explanation: 'If incoming readers are continuously allowed to read as long as at least one reader is currently active, a waiting writer can be delayed indefinitely (writer starvation).',
    difficulty: 'Medium',
    createdAt: new Date().toISOString()
  },

  // OS - Virtual Memory
  {
    id: 'q-os-mem-1',
    subjectId: 'subj-os',
    topicId: 'top-os-mem',
    question: 'What is the phenomenon called when an operating system spends more time swapping pages in and out of secondary storage than executing user instructions?',
    options: [
      'Fragmentation',
      'Thrashing',
      'Belady Anomaly',
      'Cache Invalidation'
    ],
    correctAnswer: 1,
    explanation: 'Thrashing occurs when the sum of working set sizes of active processes exceeds available physical RAM, causing continuous page faults and disk I/O saturation.',
    difficulty: 'Easy',
    createdAt: new Date().toISOString()
  },
  {
    id: 'q-os-mem-2',
    subjectId: 'subj-os',
    topicId: 'top-os-mem',
    question: 'Which page replacement algorithm suffers from Belady Anomaly (where increasing the number of page frames leads to an increased number of page faults)?',
    options: [
      'Least Recently Used (LRU)',
      'Optimal Page Replacement (OPT)',
      'First-In, First-Out (FIFO)',
      'Least Frequently Used (LFU)'
    ],
    correctAnswer: 2,
    explanation: 'FIFO is not a stack algorithm; its set of pages in memory with n frames is not necessarily a subset of pages with n+1 frames, exposing it to Belady Anomaly.',
    difficulty: 'Medium',
    createdAt: new Date().toISOString()
  },
  {
    id: 'q-os-mem-3',
    subjectId: 'subj-os',
    topicId: 'top-os-mem',
    question: 'In a 32-bit virtual address architecture with 4 KB page size, how many total entries are present in a single-level page table for a process occupying the full address space?',
    options: [
      '1,048,576 entries (2^20)',
      '4,096 entries (2^12)',
      '65,536 entries (2^16)',
      '2,097,152 entries (2^21)'
    ],
    correctAnswer: 0,
    explanation: 'Page size 4 KB = 2^12 bytes, meaning 12 bits for offset. The remaining 32 - 12 = 20 bits index virtual pages, resulting in 2^20 = 1,048,576 entries.',
    difficulty: 'Hard',
    createdAt: new Date().toISOString()
  },

  // OS - Deadlocks
  {
    id: 'q-os-dl-1',
    subjectId: 'subj-os',
    topicId: 'top-os-deadlock',
    question: 'Which of the following is NOT one of Coffman four necessary conditions for a deadlock to occur?',
    options: [
      'Mutual Exclusion',
      'Hold and Wait',
      'Preemptive Resource Scheduling',
      'Circular Wait'
    ],
    correctAnswer: 2,
    explanation: 'The Coffman condition is "No Preemption", meaning resources cannot be forcibly confiscated from a process holding them. Preemption prevents deadlocks.',
    difficulty: 'Easy',
    createdAt: new Date().toISOString()
  },
  {
    id: 'q-os-dl-2',
    subjectId: 'subj-os',
    topicId: 'top-os-deadlock',
    question: 'Banker Algorithm in operating systems is primarily used for which deadlock management strategy?',
    options: [
      'Deadlock Prevention',
      'Deadlock Avoidance',
      'Deadlock Detection and Recovery',
      'Deadlock Ignorance (Ostrich Algorithm)'
    ],
    correctAnswer: 1,
    explanation: 'Banker Algorithm dynamically checks system resource allocation to ensure that the system never enters an unsafe state, thus avoiding deadlocks.',
    difficulty: 'Medium',
    createdAt: new Date().toISOString()
  },

  // CN - TCP/IP & Transport
  {
    id: 'q-cn-tcp-1',
    subjectId: 'subj-cn',
    topicId: 'top-cn-tcp',
    question: 'During the TCP three-way handshake connection establishment, what control flags are sequentially sent by Client and Server?',
    options: [
      'SYN -> SYN-ACK -> ACK',
      'ACK -> SYN -> SYN-ACK',
      'FIN -> FIN-ACK -> ACK',
      'RST -> SYN -> ACK'
    ],
    correctAnswer: 0,
    explanation: 'Client sends SYN packet with sequence number ISN_c. Server replies with SYN-ACK with ISN_s and ack ISN_c+1. Client completes handshake with ACK.',
    difficulty: 'Easy',
    createdAt: new Date().toISOString()
  },
  {
    id: 'q-cn-tcp-2',
    subjectId: 'subj-cn',
    topicId: 'top-cn-tcp',
    question: 'In TCP congestion control, during the "Slow Start" phase, how does the congestion window (cwnd) increase upon receipt of each ACK for an entire window?',
    options: [
      'Linearly by 1 MSS per RTT',
      'Exponentially, doubling cwnd every RTT',
      'Logarithmically',
      'It remains fixed until packet loss occurs'
    ],
    correctAnswer: 1,
    explanation: 'In Slow Start, cwnd increases by 1 MSS for each received ACK, which doubles the congestion window every Round Trip Time (RTT), an exponential growth rate.',
    difficulty: 'Medium',
    createdAt: new Date().toISOString()
  },

  // CN - Subnetting
  {
    id: 'q-cn-sub-1',
    subjectId: 'subj-cn',
    topicId: 'top-cn-subnet',
    question: 'How many usable host IP addresses are available in a subnet with CIDR notation /26?',
    options: [
      '62 hosts',
      '64 hosts',
      '30 hosts',
      '126 hosts'
    ],
    correctAnswer: 0,
    explanation: 'A /26 subnet has 32 - 26 = 6 host bits. Total IP addresses = 2^6 = 64. Usable host addresses = 64 - 2 (network and broadcast) = 62.',
    difficulty: 'Easy',
    createdAt: new Date().toISOString()
  },
  {
    id: 'q-cn-sub-2',
    subjectId: 'subj-cn',
    topicId: 'top-cn-subnet',
    question: 'Given the IP address 192.168.10.138 with subnet mask 255.255.255.192 (/26), what is the directed broadcast address of this subnet?',
    options: [
      '192.168.10.191',
      '192.168.10.255',
      '192.168.10.128',
      '192.168.10.192'
    ],
    correctAnswer: 0,
    explanation: 'Subnet mask /26 breaks the octet into block size 64: subnets are .0, .64, .128, .192. Since 138 falls between 128 and 191, network address is 192.168.10.128, and broadcast is 192.168.10.191.',
    difficulty: 'Medium',
    createdAt: new Date().toISOString()
  },

  // CN - Routing
  {
    id: 'q-cn-route-1',
    subjectId: 'subj-cn',
    topicId: 'top-cn-route',
    question: 'Which routing protocol relies on the Bellman-Ford algorithm and suffers from the Count-to-Infinity problem?',
    options: [
      'Routing Information Protocol (RIP)',
      'Open Shortest Path First (OSPF)',
      'Border Gateway Protocol (BGP)',
      'IS-IS'
    ],
    correctAnswer: 0,
    explanation: 'RIP is a distance-vector protocol using Bellman-Ford algorithm. In case of link failures, routing loops can cause metrics to increment gradually to 16 (infinity).',
    difficulty: 'Easy',
    createdAt: new Date().toISOString()
  },

  // SE - Agile & Scrum
  {
    id: 'q-se-agile-1',
    subjectId: 'subj-se',
    topicId: 'top-se-agile',
    question: 'In Scrum agile framework, who has the primary responsibility for prioritizing items in the Product Backlog?',
    options: [
      'Scrum Master',
      'Product Owner',
      'Lead Developer / Architect',
      'Project Sponsor'
    ],
    correctAnswer: 1,
    explanation: 'The Product Owner is solely accountable for maximizing the value of the product and managing the Product Backlog, including ordering items by business value.',
    difficulty: 'Easy',
    createdAt: new Date().toISOString()
  },
  {
    id: 'q-se-agile-2',
    subjectId: 'subj-se',
    topicId: 'top-se-agile',
    question: 'What is the primary indicator shown on a Sprint Burn-down Chart in agile development?',
    options: [
      'Cumulative revenue generated by sprint releases',
      'Remaining work (in story points or hours) versus remaining sprint days',
      'Total code commit count per developer',
      'Number of open defects identified by QA'
    ],
    correctAnswer: 1,
    explanation: 'A sprint burndown chart plots remaining estimated effort across sprint time, visually illustrating whether the development team is on track to complete committed work.',
    difficulty: 'Medium',
    createdAt: new Date().toISOString()
  },

  // SE - Design Patterns
  {
    id: 'q-se-pat-1',
    subjectId: 'subj-se',
    topicId: 'top-se-patterns',
    question: 'Which Gang of Four (GoF) design pattern ensures a class has only one instance and provides a global access point to it?',
    options: [
      'Factory Method',
      'Singleton Pattern',
      'Observer Pattern',
      'Decorator Pattern'
    ],
    correctAnswer: 1,
    explanation: 'The Singleton pattern restricts instantiation of a class to one single instance, controlling access to shared resources like database connections or thread pools.',
    difficulty: 'Easy',
    createdAt: new Date().toISOString()
  },
  {
    id: 'q-se-pat-2',
    subjectId: 'subj-se',
    topicId: 'top-se-patterns',
    question: 'Which design pattern is best suited for defining a one-to-many dependency between objects so that when one object changes state, all dependents are notified automatically?',
    options: [
      'Observer Pattern',
      'Strategy Pattern',
      'Command Pattern',
      'Facade Pattern'
    ],
    correctAnswer: 0,
    explanation: 'The Observer pattern defines a subscription mechanism to notify multiple observing objects about any events or state transitions happening to the subject they are listening to.',
    difficulty: 'Medium',
    createdAt: new Date().toISOString()
  }
];

type GeneralStudiesQuestionData = [string, string, string, string[], number, string];

const generalStudiesQuestionData: GeneralStudiesQuestionData[] = [
  ['ancient-history', 'Easy', 'Which Harappan site is famous for its dockyard?', ['Harappa', 'Mohenjo-daro', 'Lothal', 'Kalibangan'], 2, 'Lothal, located in present-day Gujarat, is well known for its ancient dockyard, indicating maritime trade during the Harappan Civilization.'],
  ['ancient-history', 'Medium', 'Who founded the Maurya Empire?', ['Ashoka', 'Chandragupta Maurya', 'Bindusara', 'Bimbisara'], 1, 'Chandragupta Maurya founded the Maurya Empire around 322 BCE with the guidance of Chanakya.'],
  ['ancient-history', 'Medium', 'Which ruler is associated with the spread of Buddhism to different parts of Asia?', ['Chandragupta Maurya', 'Ashoka', 'Samudragupta', 'Harshavardhana'], 1, 'Emperor Ashoka adopted Buddhism after the Kalinga War and supported its spread through missionaries and inscriptions.'],
  ['medieval-history', 'Easy', 'Who founded the Mughal Empire in India?', ['Akbar', 'Babur', 'Humayun', 'Shah Jahan'], 1, 'Babur established Mughal rule in India after defeating Ibrahim Lodi in the First Battle of Panipat in 1526.'],
  ['medieval-history', 'Medium', 'Who built the Taj Mahal?', ['Akbar', 'Jahangir', 'Shah Jahan', 'Aurangzeb'], 2, 'Mughal emperor Shah Jahan commissioned the Taj Mahal at Agra in memory of his wife Mumtaz Mahal.'],
  ['medieval-history', 'Medium', 'Who founded the Sikh religion?', ['Guru Nanak', 'Guru Arjan Dev', 'Guru Gobind Singh', 'Guru Tegh Bahadur'], 0, 'Guru Nanak Dev was the founder of Sikhism and the first of the ten Sikh Gurus.'],
  ['modern-history', 'Easy', 'The Revolt of 1857 began at which place?', ['Delhi', 'Meerut', 'Kanpur', 'Lucknow'], 1, 'The Revolt of 1857 began at Meerut on 10 May 1857.'],
  ['modern-history', 'Medium', 'Who founded the Indian National Congress in 1885 along with other leaders?', ['A.O. Hume', 'Mahatma Gandhi', 'Bal Gangadhar Tilak', 'Subhas Chandra Bose'], 0, 'Allan Octavian Hume played a major role in establishing the Indian National Congress in 1885.'],
  ['modern-history', 'Medium', 'The Non-Cooperation Movement was launched by Mahatma Gandhi in which year?', ['1915', '1919', '1920', '1930'], 2, 'Mahatma Gandhi launched the Non-Cooperation Movement in 1920 against British rule.'],
  ['modern-history', 'Medium', 'The Dandi March was associated with which movement?', ['Quit India Movement', 'Civil Disobedience Movement', 'Non-Cooperation Movement', 'Swadeshi Movement'], 1, 'The Dandi March of 1930 marked the beginning of the Civil Disobedience Movement and challenged the British salt law.'],
  ['constitution', 'Easy', 'When did the Constitution of India come into effect?', ['15 August 1947', '26 November 1949', '26 January 1950', '2 October 1950'], 2, 'The Constitution of India came into force on 26 January 1950, celebrated as Republic Day.'],
  ['constitution', 'Medium', 'Who is known as the chief architect of the Indian Constitution?', ['Mahatma Gandhi', 'Dr. B. R. Ambedkar', 'Jawaharlal Nehru', 'Sardar Patel'], 1, 'Dr. B. R. Ambedkar served as Chairman of the Drafting Committee of the Constituent Assembly.'],
  ['constitution', 'Medium', 'How many Fundamental Rights are currently guaranteed by the Constitution of India?', ['5', '6', '7', '8'], 1, 'The Constitution currently provides six Fundamental Rights. The Right to Property was removed by the 44th Constitutional Amendment.'],
  ['polity', 'Easy', 'Who is the constitutional head of the Union of India?', ['Prime Minister', 'President', 'Chief Justice of India', 'Vice-President'], 1, 'The President is the constitutional head of the Union.'],
  ['polity', 'Medium', 'What is the maximum strength of the Lok Sabha as prescribed by the Constitution?', ['545', '550', '552', '560'], 2, 'The constitutional maximum strength of the Lok Sabha is 552 members.'],
  ['polity', 'Medium', 'Which House of Parliament is a permanent House?', ['Lok Sabha', 'Rajya Sabha', 'Both Houses', 'Neither House'], 1, 'Rajya Sabha is a permanent House and is not subject to dissolution.'],
  ['geography', 'Easy', 'Which is the longest river in India?', ['Yamuna', 'Godavari', 'Ganga', 'Narmada'], 2, 'The Ganga is generally regarded as the longest river in India.'],
  ['geography', 'Medium', 'Which soil is most suitable for growing cotton?', ['Alluvial soil', 'Black soil', 'Laterite soil', 'Desert soil'], 1, 'Black soil, also called regur soil, has high moisture-retaining capacity and is suitable for cotton.'],
  ['geography', 'Medium', 'Which is the highest mountain peak located entirely within India?', ['Mount Everest', 'Kanchenjunga', 'Nanda Devi', 'K2'], 1, 'Kanchenjunga is the highest peak associated with India.'],
  ['world-geography', 'Easy', 'Which is the largest continent in the world by area?', ['Africa', 'Europe', 'Asia', 'North America'], 2, 'Asia is the largest continent in terms of both area and population.'],
  ['world-geography', 'Medium', 'Which is the largest ocean on Earth?', ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'], 3, 'The Pacific Ocean is the largest and deepest ocean on Earth.'],
  ['economy', 'Easy', 'Which institution is responsible for monetary policy in India?', ['SEBI', 'RBI', 'NITI Aayog', 'Finance Commission'], 1, 'The Reserve Bank of India is the central bank responsible for monetary policy.'],
  ['economy', 'Medium', 'What does GDP stand for?', ['Gross Domestic Product', 'General Development Product', 'Gross Development Process', 'General Domestic Production'], 0, 'GDP stands for Gross Domestic Product and measures final goods and services produced within an economy.'],
  ['economy', 'Medium', 'Which tax was introduced in India as a comprehensive indirect tax in 2017?', ['VAT', 'GST', 'Excise Duty', 'Service Tax'], 1, 'The Goods and Services Tax was introduced in India on 1 July 2017.'],
  ['physics', 'Easy', 'What is the SI unit of force?', ['Joule', 'Watt', 'Newton', 'Pascal'], 2, 'The SI unit of force is the Newton (N).'],
  ['physics', 'Easy', 'Which instrument is used to measure electric current?', ['Voltmeter', 'Ammeter', 'Barometer', 'Thermometer'], 1, 'An ammeter measures electric current in a circuit.'],
  ['physics', 'Medium', 'What is the approximate speed of light in vacuum?', ['3 x 10^6 m/s', '3 x 10^7 m/s', '3 x 10^8 m/s', '3 x 10^9 m/s'], 2, 'The speed of light in vacuum is approximately 3 x 10^8 metres per second.'],
  ['chemistry', 'Easy', 'What is the chemical formula of water?', ['CO2', 'H2O', 'O2', 'H2O2'], 1, 'A water molecule contains two hydrogen atoms and one oxygen atom, giving the formula H2O.'],
  ['chemistry', 'Medium', 'Which gas is released when an acid reacts with a carbonate?', ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'], 2, 'Acids react with carbonates to produce salt, water, and carbon dioxide gas.'],
  ['chemistry', 'Medium', 'What is the pH value of a neutral solution at 25°C?', ['0', '5', '7', '14'], 2, 'At 25°C, a neutral solution such as pure water has a pH of 7.'],
  ['biology', 'Easy', 'Which organ is primarily responsible for pumping blood throughout the human body?', ['Brain', 'Liver', 'Heart', 'Kidney'], 2, 'The heart is a muscular organ that pumps blood throughout the body.'],
  ['biology', 'Easy', 'Which part of a plant carries out most photosynthesis?', ['Root', 'Leaf', 'Flower', 'Seed'], 1, 'Leaves contain chlorophyll and are the primary site of photosynthesis in most plants.'],
  ['biology', 'Medium', 'Which blood cells help in fighting infections?', ['Red blood cells', 'White blood cells', 'Platelets', 'Plasma cells only'], 1, 'White blood cells are important components of the immune system.'],
  ['environment', 'Easy', 'Which gas is the major contributor to the enhanced greenhouse effect from human activities?', ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Helium'], 1, 'Carbon dioxide is a major greenhouse gas whose concentration has increased due to human activities.'],
  ['environment', 'Medium', 'Which of the following is a renewable source of energy?', ['Coal', 'Petroleum', 'Solar energy', 'Natural gas'], 2, 'Solar energy is renewable because sunlight is continuously replenished.'],
  ['environment', 'Medium', 'The Chipko Movement was primarily associated with the conservation of:', ['Rivers', 'Forests', 'Wildlife', 'Soil'], 1, 'The Chipko Movement was a forest conservation movement opposing the cutting of trees.'],
  ['up-gk', 'Easy', 'What is the capital of Uttar Pradesh?', ['Kanpur', 'Prayagraj', 'Lucknow', 'Varanasi'], 2, 'Lucknow is the capital of Uttar Pradesh.'],
  ['up-gk', 'Easy', 'Which city of Uttar Pradesh is known as the City of Nawabs?', ['Agra', 'Lucknow', 'Kanpur', 'Meerut'], 1, 'Lucknow is known as the City of Nawabs because of its association with the Nawabs of Awadh.'],
  ['up-gk', 'Medium', 'The Taj Mahal is located on the bank of which river?', ['Ganga', 'Yamuna', 'Gomti', 'Chambal'], 1, 'The Taj Mahal is situated on the southern bank of the Yamuna River in Agra.'],
  ['up-gk', 'Medium', 'Which city is famous for the Triveni Sangam?', ['Varanasi', 'Ayodhya', 'Prayagraj', 'Mathura'], 2, 'Prayagraj is famous for the Triveni Sangam.'],
  ['up-culture', 'Medium', 'Sarnath, near Varanasi, is associated with which important event in the life of Gautama Buddha?', ['Birth', 'Enlightenment', 'First Sermon', 'Mahaparinirvana'], 2, 'Gautama Buddha delivered his first sermon at Sarnath after attaining enlightenment.'],
  ['up-culture', 'Medium', 'Which classical dance form is traditionally associated with Uttar Pradesh?', ['Kathak', 'Bharatanatyam', 'Kuchipudi', 'Kathakali'], 0, 'Kathak developed strongly in North India and has important associations with Uttar Pradesh.'],
  ['art-culture', 'Easy', 'Which monument is located in Delhi and was built by Qutb-ud-din Aibak?', ['Red Fort', 'Qutub Minar', 'India Gate', "Humayun's Tomb"], 1, 'Qutb-ud-din Aibak began construction of the Qutub Minar.'],
  ['art-culture', 'Medium', 'Bharatanatyam is a classical dance form associated primarily with which state?', ['Tamil Nadu', 'Punjab', 'Assam', 'Gujarat'], 0, 'Bharatanatyam originated in the temples and cultural traditions of Tamil Nadu.'],
  ['symbols', 'Easy', 'What is the national animal of India?', ['Lion', 'Elephant', 'Bengal Tiger', 'Leopard'], 2, 'The Bengal Tiger is the national animal of India.'],
  ['symbols', 'Easy', 'What is the national aquatic animal of India?', ['Blue Whale', 'Ganges River Dolphin', 'Crocodile', 'Sea Turtle'], 1, 'The Ganges River Dolphin is India\'s national aquatic animal.'],
  ['books', 'Medium', 'Who wrote the book Discovery of India?', ['Mahatma Gandhi', 'Jawaharlal Nehru', 'Sardar Patel', 'Rabindranath Tagore'], 1, 'Jawaharlal Nehru wrote The Discovery of India during his imprisonment.'],
  ['books', 'Medium', 'Who wrote My Experiments with Truth?', ['Mahatma Gandhi', 'B. R. Ambedkar', 'Subhas Chandra Bose', 'Jawaharlal Nehru'], 0, 'My Experiments with Truth is the autobiography of Mahatma Gandhi.'],
  ['sports', 'Easy', 'Which award is India\'s highest sporting honour?', ['Arjuna Award', 'Major Dhyan Chand Khel Ratna Award', 'Dronacharya Award', 'Padma Shri'], 1, 'The Major Dhyan Chand Khel Ratna Award is India\'s highest sporting honour.'],
  ['sports', 'Medium', 'The Dronacharya Award is primarily given for excellence in:', ['Sports coaching', 'Sports journalism', 'Sports administration', 'Sports commentary'], 0, 'The Dronacharya Award recognizes outstanding sports coaches.']
];

export const UPPET_GENERAL_STUDIES_QUESTIONS: Question[] = generalStudiesQuestionData.map(([topic, difficulty, question, options, correctAnswer, explanation], index) => ({
  id: `q-uppet-gs-${index + 1}`,
  subjectId: 'subj-uppet-general-studies',
  topicId: `top-uppet-gs-${topic}`,
  question,
  options,
  correctAnswer,
  explanation,
  difficulty: difficulty as Question['difficulty'],
  createdAt: new Date().toISOString()
}));

export const UPPET_GENERAL_STUDIES_TESTS: Test[] = [
  {
    id: 'test-uppet-gs-mock-1',
    title: 'UPPET General Studies Mock Test 1',
    subjectId: 'subj-uppet-general-studies',
    topics: UPPET_GENERAL_STUDIES_TOPICS.slice(0, 8).map(topic => topic.id),
    questions: UPPET_GENERAL_STUDIES_QUESTIONS.slice(0, 25).map(question => question.id),
    duration: 30,
    difficulty: 'Medium',
    createdAt: new Date().toISOString()
  },
  {
    id: 'test-uppet-gs-mock-2',
    title: 'UPPET General Studies Mock Test 2',
    subjectId: 'subj-uppet-general-studies',
    topics: UPPET_GENERAL_STUDIES_TOPICS.slice(8).map(topic => topic.id),
    questions: UPPET_GENERAL_STUDIES_QUESTIONS.slice(25).map(question => question.id),
    duration: 30,
    difficulty: 'Medium',
    createdAt: new Date().toISOString()
  }
];

type ReasoningQuestionData = [string, string, string, string[], number, string];

const reasoningQuestionData: ReasoningQuestionData[] = [
  ['Analogy', 'Easy', 'Book is related to Reading in the same way as Food is related to:', ['Cooking', 'Eating', 'Buying', 'Serving'], 1, 'A book is used for reading, similarly food is used for eating.'],
  ['Analogy', 'Medium', 'Bird : Nest :: Lion : ?', ['Cave', 'Forest', 'Den', 'Cage'], 2, 'A bird lives in a nest, while a lion lives in a den.'],
  ['Analogy', 'Medium', '8 : 64 :: 12 : ?', ['124', '144', '132', '156'], 1, '8 squared is 64, therefore 12 squared is 144.'],
  ['Analogy', 'Medium', 'Doctor : Hospital :: Teacher : ?', ['School', 'Office', 'Laboratory', 'Court'], 0, 'A doctor generally works in a hospital, while a teacher generally works in a school.'],
  ['Analogy', 'Hard', '27 : 3 :: 125 : ?', ['4', '5', '6', '7'], 1, 'The cube root of 27 is 3 and the cube root of 125 is 5.'],
  ['Classification', 'Easy', 'Find the odd one out.', ['Apple', 'Mango', 'Potato', 'Banana'], 2, 'Apple, mango and banana are fruits, whereas potato is a vegetable.'],
  ['Classification', 'Medium', 'Find the odd number.', ['16', '25', '36', '48'], 3, '16, 25 and 36 are perfect squares. 48 is not a perfect square.'],
  ['Classification', 'Medium', 'Find the odd one out.', ['January', 'March', 'May', 'June'], 3, 'January, March and May have 31 days. June has 30 days.'],
  ['Classification', 'Medium', 'Find the odd pair.', ['2 - 8', '3 - 27', '4 - 64', '5 - 100'], 3, 'In the first three pairs, the second number is the cube of the first.'],
  ['Classification', 'Easy', 'Find the odd one out.', ['Square', 'Triangle', 'Rectangle', 'Circle'], 3, 'A square, triangle and rectangle have straight sides. A circle does not.'],
  ['Number Series', 'Easy', 'Find the next number: 2, 4, 6, 8, ?', ['9', '10', '11', '12'], 1, 'Each number increases by 2.'],
  ['Number Series', 'Medium', 'Find the next number: 3, 6, 12, 24, ?', ['36', '42', '48', '54'], 2, 'Each number is multiplied by 2.'],
  ['Number Series', 'Medium', 'Find the missing number: 5, 10, 20, 40, ?', ['60', '70', '80', '90'], 2, 'Every term is multiplied by 2.'],
  ['Number Series', 'Medium', 'Find the next number: 1, 4, 9, 16, 25, ?', ['30', '36', '40', '49'], 1, 'These are consecutive squares, so the next term is 6 squared, or 36.'],
  ['Number Series', 'Hard', 'Find the next number: 2, 6, 12, 20, 30, ?', ['36', '40', '42', '44'], 2, 'The differences are 4, 6, 8, 10, so the next difference is 12.'],
  ['Alphabet Series', 'Easy', 'Find the next letter: A, C, E, G, ?', ['H', 'I', 'J', 'K'], 1, 'Every second alphabet is selected.'],
  ['Alphabet Series', 'Medium', 'Find the next letter: B, E, H, K, ?', ['M', 'N', 'O', 'P'], 1, 'The letters increase by 3 positions.'],
  ['Alphabet Series', 'Medium', 'Find the missing letter: A, D, G, J, ?', ['K', 'L', 'M', 'N'], 2, 'Each letter is three positions ahead of the previous letter.'],
  ['Coding-Decoding', 'Easy', 'If CAT is coded as DBU, then how is DOG coded?', ['EPH', 'EOG', 'FPH', 'DPH'], 0, 'Each letter is shifted one position forward, so DOG becomes EPH.'],
  ['Coding-Decoding', 'Medium', 'If PEN is coded as QFO, then how is BOOK coded?', ['CPPL', 'CQQM', 'BPPL', 'CPPK'], 0, 'Each letter is shifted one position forward.'],
  ['Coding-Decoding', 'Medium', 'If DELHI is coded as EFMIJ, then how will INDIA be coded?', ['JOEJB', 'JOEJB', 'JOEIA', 'HMCZH'], 0, 'Each letter is replaced by the next alphabet letter.'],
  ['Blood Relations', 'Easy', 'Pointing to a boy, Ravi said, "He is the son of my father\'s only son." How is the boy related to Ravi?', ['Brother', 'Son', 'Nephew', 'Cousin'], 1, 'Ravi\'s father\'s only son is Ravi himself, so the boy is Ravi\'s son.'],
  ['Blood Relations', 'Medium', 'A is the brother of B. B is the sister of C. How is A related to C?', ['Brother', 'Sister', 'Father', 'Uncle'], 0, 'A and B are siblings, and B and C are siblings.'],
  ['Blood Relations', 'Medium', 'Pointing to a woman, Amit said, "She is the daughter of my mother\'s only daughter." How is the woman related to Amit?', ['Sister', 'Daughter', 'Niece', 'Mother'], 2, 'Amit\'s mother\'s only daughter is Amit\'s sister, whose daughter is his niece.'],
  ['Direction Sense', 'Easy', 'A person walks 5 km north and then turns right and walks 3 km. In which direction is he from the starting point?', ['North-East', 'North-West', 'South-East', 'South-West'], 0, 'He moves north and then east, so he is north-east of the starting point.'],
  ['Direction Sense', 'Medium', 'Rahul walks 10 m east, turns left and walks 5 m, then turns left and walks 10 m. In which direction is he from his starting point?', ['North', 'South', 'East', 'West'], 0, 'He returns west after moving north, ending 5 m north of the starting point.'],
  ['Direction Sense', 'Medium', 'A man faces north. He turns 90 degrees clockwise, then 180 degrees anticlockwise. Which direction is he facing now?', ['North', 'South', 'East', 'West'], 3, 'North becomes east, then east becomes west after a 180-degree anticlockwise turn.'],
  ['Ranking and Order', 'Easy', 'In a class of 40 students, Ravi ranks 12th from the top. What is his rank from the bottom?', ['27th', '28th', '29th', '30th'], 2, 'Rank from bottom is 40 - 12 + 1 = 29.'],
  ['Ranking and Order', 'Medium', 'Amit is 15th from the left and 18th from the right in a row. How many people are there in the row?', ['31', '32', '33', '34'], 1, 'Total is 15 + 18 - 1 = 32.'],
  ['Syllogism', 'Medium', 'Statements: All books are papers. Some papers are files. Conclusions: I. Some books are files. II. All books are papers. Which conclusion follows?', ['Only I', 'Only II', 'Both I and II', 'Neither I nor II'], 1, 'Conclusion II directly follows; no definite relationship between books and files is given.'],
  ['Syllogism', 'Medium', 'Statements: All cats are animals. All animals are living beings. Conclusions: I. All cats are living beings. II. All living beings are cats.', ['Only I follows', 'Only II follows', 'Both follow', 'Neither follows'], 0, 'Cats are a subset of animals, which are a subset of living beings.'],
  ['Venn Diagram', 'Medium', 'Which diagram best represents the relationship among Doctors, Men and Women?', ['Doctors completely inside Men', 'Doctors completely inside Women', 'Men and Women are separate, and Doctors overlap both', 'All three are completely separate'], 2, 'Doctors can be either men or women, so Doctors overlap both groups.'],
  ['Venn Diagram', 'Medium', 'Which relationship correctly represents Students, Boys and Girls?', ['Boys and Girls overlap completely', 'Students contain both Boys and Girls', 'Students are completely outside Boys and Girls', 'Boys contain Students'], 1, 'Students can consist of both boys and girls.'],
  ['Mathematical Operations', 'Medium', 'If + means multiplication, - means addition, multiplication means division and division means subtraction, find: 8 + 4 - 6.', ['32', '38', '40', '42'], 1, 'Replace the symbols: 8 multiplied by 4 plus 6 equals 38.'],
  ['Mathematical Operations', 'Medium', 'If A * B means A + B, A # B means A - B, and A $ B means A multiplied by B, find 8 $ 3 * 2.', ['24', '26', '28', '30'], 1, '8 multiplied by 3 plus 2 equals 26.'],
  ['Calendar', 'Medium', 'If 1 January is Monday, what day will be 8 January?', ['Monday', 'Tuesday', 'Sunday', 'Wednesday'], 0, 'The difference is exactly 7 days, so the day repeats.'],
  ['Calendar', 'Medium', 'If today is Wednesday, what day will it be after 45 days?', ['Friday', 'Saturday', 'Sunday', 'Monday'], 1, '45 divided by 7 leaves remainder 3; three days after Wednesday is Saturday.'],
  ['Clock', 'Medium', 'What is the angle between the hour and minute hands at 3:00?', ['60 degrees', '90 degrees', '120 degrees', '180 degrees'], 1, 'At 3:00 the hands form a 90-degree angle.'],
  ['Clock', 'Hard', 'What is the angle between the hands of a clock at 6:00?', ['90 degrees', '120 degrees', '180 degrees', '360 degrees'], 2, 'At 6:00 the hands are opposite, making 180 degrees.'],
  ['Statement and Conclusion', 'Medium', 'Statement: All students should read newspapers regularly to improve their general awareness. Conclusions: I. Reading newspapers can improve general awareness. II. Every student already reads newspapers.', ['Only I follows', 'Only II follows', 'Both follow', 'Neither follows'], 0, 'The statement supports the usefulness of newspapers, not that every student already reads them.'],
  ['Statement and Conclusion', 'Medium', 'Statement: The government has advised citizens to save water. Conclusions: I. Water conservation is considered important. II. There is unlimited water available.', ['Only I follows', 'Only II follows', 'Both follow', 'Neither follows'], 0, 'The advice indicates the importance of water conservation.'],
  ['Statement and Assumption', 'Medium', 'Statement: Use our coaching institute to improve your performance in competitive examinations. Assumptions: I. Students want to improve their performance. II. Coaching can help students improve their performance.', ['Only I is implicit', 'Only II is implicit', 'Both I and II are implicit', 'Neither is implicit'], 2, 'The advertisement assumes both a desire for improvement and that coaching can help.'],
  ['Missing Number', 'Medium', 'Find the missing number: 2, 4, 8; 3, 6, 12; 5, 10, ?', ['15', '18', '20', '25'], 2, 'In each row, each term is twice the previous term, so 10 times 2 is 20.'],
  ['Missing Number', 'Medium', 'Find the missing number: 4, 8, 12; 5, 10, 15; 7, 14, ?', ['18', '20', '21', '24'], 2, 'The third number is the sum of the first two numbers: 7 + 14 = 21.'],
  ['Seating Arrangement', 'Medium', 'Five persons A, B, C, D and E sit in a row. A is left of B, B is left of C, D is right of C and E is right of D. Who sits in the middle?', ['A', 'B', 'C', 'D'], 2, 'The arrangement is A - B - C - D - E, so C is in the middle.'],
  ['Seating Arrangement', 'Hard', 'Six persons P, Q, R, S, T and U sit in a row. P is at the extreme left. U is at the extreme right. Q is immediately right of P. R is immediately right of Q. Who sits third from the left?', ['P', 'Q', 'R', 'S'], 2, 'The arrangement begins P - Q - R, so R is third from the left.'],
  ['Data Sufficiency', 'Hard', 'What is the age of Ravi? I. Ravi is 5 years older than Amit. II. Amit is 20 years old.', ['Statement I alone is sufficient', 'Statement II alone is sufficient', 'Both statements together are sufficient', 'Even both together are insufficient'], 2, 'Together they give Ravi = 20 + 5 = 25 years.'],
  ['Mirror Image', 'Medium', 'A mirror is placed on the right side of the word CAT. Which type of transformation occurs in its mirror image?', ['Top and bottom are reversed', 'Left and right are reversed', 'Only vowels are reversed', 'No transformation occurs'], 1, 'A vertical mirror produces a left-right reversal.'],
  ['Logical Sequence', 'Medium', 'Arrange in logical order: 1. Interview 2. Application 3. Selection 4. Written Examination', ['2, 4, 1, 3', '4, 2, 1, 3', '2, 1, 4, 3', '1, 2, 4, 3'], 0, 'The normal order is application, written examination, interview, then selection.'],
  ['Logical Sequence', 'Medium', 'Arrange in correct order: 1. Seed 2. Fruit 3. Plant 4. Flower', ['1, 3, 4, 2', '3, 1, 4, 2', '1, 4, 3, 2', '4, 1, 3, 2'], 0, 'The natural sequence is Seed, Plant, Flower, Fruit.']
];

export const UPPET_REASONING_QUESTIONS: Question[] = reasoningQuestionData.map(([topic, difficulty, question, options, correctAnswer, explanation], index) => ({
  id: `q-uppet-reasoning-${index + 1}`,
  subjectId: 'subj-uppet-reasoning',
  topicId: `top-uppet-reasoning-${topic.toLowerCase().replace(/[^a-z]+/g, '-')}`,
  question,
  options,
  correctAnswer,
  explanation,
  difficulty: difficulty as Question['difficulty'],
  createdAt: new Date().toISOString()
}));

export const UPPET_PAPER_MOCK_QUESTIONS: Question[] = [
  ...UPPET_REASONING_QUESTIONS,
  ...UPPET_GENERAL_STUDIES_QUESTIONS
].map((question, index) => ({
  ...question,
  id: `q-uppet-paper-mock-${index + 1}`,
  subjectId: 'subj-uppet-paper-mock',
  topicId: 'top-uppet-paper-mock-mixed'
}));

export const UPPET_PAPER_MOCK_TESTS: Test[] = Array.from({ length: 7 }, (_, index) => ({
  id: `test-uppet-paper-mock-${index + 1}`,
  title: `UPPET Paper Mock ${index + 1}`,
  subjectId: 'subj-uppet-paper-mock',
  topics: ['top-uppet-paper-mock-mixed'],
  questions: UPPET_PAPER_MOCK_QUESTIONS.map(question => question.id),
  duration: 120,
  difficulty: 'Medium',
  status: 'ACTIVE',
  createdAt: new Date().toISOString()
}));

export const INITIAL_TESTS: Test[] = [
  {
    id: 'test-dbms-mock-1',
    title: 'DBMS Comprehensive Assessment Mock Test',
    subjectId: 'subj-dbms',
    topics: ['top-dbms-norm', 'top-dbms-join', 'top-dbms-tx', 'top-dbms-idx'],
    questions: ['q-norm-1', 'q-norm-2', 'q-norm-3', 'q-norm-4', 'q-join-1', 'q-join-2', 'q-join-3', 'q-tx-1', 'q-tx-2', 'q-tx-3', 'q-idx-1', 'q-idx-2'],
    duration: 15,
    difficulty: 'Medium',
    createdAt: new Date().toISOString()
  },
  {
    id: 'test-dsa-mock-1',
    title: 'Data Structures & Algorithms Challenge',
    subjectId: 'subj-dsa',
    topics: ['top-dsa-trees', 'top-dsa-graphs', 'top-dsa-sort'],
    questions: ['q-bst-1', 'q-bst-2', 'q-bst-3', 'q-graph-1', 'q-graph-2', 'q-graph-3', 'q-sort-1', 'q-sort-2'],
    duration: 12,
    difficulty: 'Hard',
    createdAt: new Date().toISOString()
  },
  {
    id: 'test-os-mock-1',
    title: 'Operating Systems Core Competency Quiz',
    subjectId: 'subj-os',
    topics: ['top-os-sync', 'top-os-mem', 'top-os-deadlock'],
    questions: ['q-os-sync-1', 'q-os-sync-2', 'q-os-sync-3', 'q-os-mem-1', 'q-os-mem-2', 'q-os-mem-3', 'q-os-dl-1', 'q-os-dl-2'],
    duration: 10,
    difficulty: 'Medium',
    createdAt: new Date().toISOString()
  },
  {
    id: 'test-cn-mock-1',
    title: 'Computer Networks & Protocols Diagnostic',
    subjectId: 'subj-cn',
    topics: ['top-cn-tcp', 'top-cn-subnet', 'top-cn-route'],
    questions: ['q-cn-tcp-1', 'q-cn-tcp-2', 'q-cn-sub-1', 'q-cn-sub-2', 'q-cn-route-1'],
    duration: 8,
    difficulty: 'Easy',
    createdAt: new Date().toISOString()
  }
];

export const UPPET_REASONING_TESTS: Test[] = [
  {
    id: 'test-uppet-reasoning-mock-1',
    title: 'UPPET Reasoning Mock Test 1',
    subjectId: 'subj-uppet-reasoning',
    topics: UPPET_REASONING_TOPICS.slice(0, 10).map(topic => topic.id),
    questions: UPPET_REASONING_QUESTIONS.slice(0, 25).map(question => question.id),
    duration: 30,
    difficulty: 'Medium',
    createdAt: new Date().toISOString()
  },
  {
    id: 'test-uppet-reasoning-mock-2',
    title: 'UPPET Reasoning Mock Test 2',
    subjectId: 'subj-uppet-reasoning',
    topics: UPPET_REASONING_TOPICS.slice(10).map(topic => topic.id),
    questions: UPPET_REASONING_QUESTIONS.slice(25).map(question => question.id),
    duration: 30,
    difficulty: 'Medium',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-student-demo',
    name: 'Student',
    email: 'student@example.com',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'user-admin-demo-1',
    name: 'vikram',
    email: 'vikram@example.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'user-admin-demo-2',
    name: 'Aisha',
    email: 'aisha.admin@example.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'user-admin-demo-3',
    name: 'Nathan',
    email: 'nathan.admin@example.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'user-admin-demo-4',
    name: 'Olivia',
    email: 'olivia.admin@example.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'user-admin-demo-5',
    name: 'Mason',
    email: 'mason.admin@example.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
