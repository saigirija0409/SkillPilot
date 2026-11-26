-- =============================================================================
-- SkillPilot Phase 2 Seed Data: Skills, Target Career Roles, Role Skills & Demo Opportunities
-- Execution order: 4 of 4 (run after all migrations 0001..0003)
-- Note: All seeded rows are clearly marked is_demo = true for testing/demonstration.
-- =============================================================================

-- 1. Skills (30 professional skills)
INSERT INTO public.skills (slug, name, category, description, is_demo)
VALUES
    ('python', 'Python', 'Programming', 'General-purpose programming for data, backend, and automation.', true),
    ('sql', 'SQL', 'Data', 'Relational querying, joins, window functions, and schema design.', true),
    ('typescript', 'TypeScript', 'Programming', 'Typed JavaScript for scalable web and backend applications.', true),
    ('javascript', 'JavaScript', 'Programming', 'Core web scripting language for interactive frontends and Node.js.', true),
    ('git', 'Git & Version Control', 'Software Engineering', 'Branching, pull requests, code reviews, and collaborative workflows.', true),
    ('data-visualization', 'Data Visualization', 'Data', 'Communicating quantitative insights using charts and dashboards.', true),
    ('statistics', 'Statistics & Probability', 'Data Science', 'Hypothesis testing, distributions, confidence intervals, and A/B testing.', true),
    ('excel-spreadsheets', 'Spreadsheets & BI Modeling', 'Data', 'Pivot tables, analytical formulas, and business KPI modeling.', true),
    ('data-cleaning', 'Data Cleaning & Wrangling', 'Data', 'Handling missing values, outliers, normalization, and ETL prep.', true),
    ('pandas', 'Pandas & NumPy', 'Data Science', 'Vectorized data manipulation and numerical computing in Python.', true),
    ('scikit-learn', 'Scikit-Learn & Classical ML', 'Machine Learning', 'Regression, classification, clustering, cross-validation, and pipelines.', true),
    ('deep-learning', 'Deep Learning (PyTorch)', 'Machine Learning', 'Neural networks, backpropagation, embeddings, and model training.', true),
    ('nlp-llms', 'NLP & Generative AI', 'Machine Learning', 'Text embeddings, prompt engineering, RAG, and LLM application design.', true),
    ('mlops', 'MLOps & Model Serving', 'Machine Learning', 'Model packaging, evaluation tracking, API serving, and drift monitoring.', true),
    ('fastapi', 'FastAPI & REST APIs', 'Backend', 'Building validated, typed HTTP APIs and microservices in Python.', true),
    ('react-nextjs', 'React & Next.js', 'Frontend', 'Component architecture, routing, state management, and full-stack SSR.', true),
    ('system-design', 'System Design', 'Software Engineering', 'Scalability, caching, data modeling, reliability, and API architecture.', true),
    ('automated-testing', 'Automated Testing', 'Software Engineering', 'Unit, integration, and end-to-end testing with reproducible assertions.', true),
    ('docker-containers', 'Docker & Containers', 'Cloud & DevOps', 'Containerizing applications for portable development and deployment.', true),
    ('kubernetes', 'Kubernetes & Orchestration', 'Cloud & DevOps', 'Container scheduling, scaling, service discovery, and rollouts.', true),
    ('aws-cloud', 'Cloud Architecture (AWS/GCP)', 'Cloud & DevOps', 'Managed compute, storage, VPC networking, and serverless infrastructure.', true),
    ('terraform-iac', 'Infrastructure as Code', 'Cloud & DevOps', 'Declarative cloud provisioning with Terraform or similar IaC tools.', true),
    ('cicd-pipelines', 'CI/CD Pipelines', 'Cloud & DevOps', 'Automated build, lint, test, and deployment pipelines.', true),
    ('linux-bash', 'Linux & Shell Scripting', 'Cloud & DevOps', 'System administration, permissions, networking tools, and automation.', true),
    ('iam-security', 'Identity & Access Management', 'Cybersecurity', 'Least-privilege access control, RBAC, OAuth/JWT, and authentication.', true),
    ('network-security', 'Network Security', 'Cybersecurity', 'Firewalls, TLS, packet inspection, zero-trust segmentation, and VPNs.', true),
    ('threat-detection', 'Threat Detection & SIEM', 'Cybersecurity', 'Log correlation, alert triage, anomaly detection, and incident response.', true),
    ('vulnerability-mgmt', 'Vulnerability Assessment', 'Cybersecurity', 'OWASP Top 10, dependency auditing, static/dynamic scanning, and remediation.', true),
    ('incident-response', 'Incident Response', 'Cybersecurity', 'Containment, root-cause forensics, playbooks, and post-incident review.', true),
    ('technical-communication', 'Stakeholder Communication', 'Professional', 'Translating technical trade-offs and metrics for business decisions.', true)
ON CONFLICT (slug) DO UPDATE
SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    is_demo = EXCLUDED.is_demo;

-- 2. Target Career Roles (6 core roles)
INSERT INTO public.career_roles (slug, title, category, description, is_demo)
VALUES
    ('data-analyst', 'Data Analyst', 'Data & Analytics', 'Transforms structured datasets into actionable KPIs, dashboards, and business insights.', true),
    ('data-scientist', 'Data Scientist', 'Data & AI', 'Applies statistical modeling, experimentation, and machine learning to solve predictive problems.', true),
    ('ml-engineer', 'ML Engineer', 'Data & AI', 'Designs, trains, evaluates, and deploys production machine learning and LLM systems.', true),
    ('software-engineer', 'Software Engineer', 'Engineering', 'Architects, builds, tests, and maintains reliable full-stack and backend applications.', true),
    ('cloud-engineer', 'Cloud Engineer', 'Infrastructure', 'Designs automated, resilient, and cost-effective cloud infrastructure and CI/CD workflows.', true),
    ('cybersecurity-analyst', 'Cybersecurity Analyst', 'Security', 'Monitors threats, hardens systems, enforces access controls, and leads incident response.', true)
ON CONFLICT (slug) DO UPDATE
SET
    title = EXCLUDED.title,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    is_demo = EXCLUDED.is_demo;

-- 3. Role Skill Requirements
WITH role_skill_matrix(role_slug, skill_slug, required_level, importance_weight) AS (
    VALUES
        -- Data Analyst
        ('data-analyst', 'sql', 4, 0.25),
        ('data-analyst', 'excel-spreadsheets', 4, 0.20),
        ('data-analyst', 'data-visualization', 4, 0.20),
        ('data-analyst', 'data-cleaning', 4, 0.15),
        ('data-analyst', 'statistics', 3, 0.10),
        ('data-analyst', 'python', 3, 0.05),
        ('data-analyst', 'technical-communication', 4, 0.05),

        -- Data Scientist
        ('data-scientist', 'python', 4, 0.20),
        ('data-scientist', 'statistics', 4, 0.20),
        ('data-scientist', 'sql', 4, 0.15),
        ('data-scientist', 'pandas', 4, 0.15),
        ('data-scientist', 'scikit-learn', 4, 0.15),
        ('data-scientist', 'data-visualization', 3, 0.10),
        ('data-scientist', 'technical-communication', 3, 0.05),

        -- ML Engineer
        ('ml-engineer', 'python', 5, 0.20),
        ('ml-engineer', 'scikit-learn', 4, 0.15),
        ('ml-engineer', 'deep-learning', 4, 0.20),
        ('ml-engineer', 'nlp-llms', 4, 0.15),
        ('ml-engineer', 'mlops', 4, 0.15),
        ('ml-engineer', 'fastapi', 4, 0.10),
        ('ml-engineer', 'docker-containers', 3, 0.05),

        -- Software Engineer
        ('software-engineer', 'typescript', 4, 0.20),
        ('software-engineer', 'react-nextjs', 4, 0.15),
        ('software-engineer', 'python', 4, 0.15),
        ('software-engineer', 'sql', 4, 0.15),
        ('software-engineer', 'git', 4, 0.10),
        ('software-engineer', 'automated-testing', 4, 0.15),
        ('software-engineer', 'system-design', 3, 0.10),

        -- Cloud Engineer
        ('cloud-engineer', 'aws-cloud', 4, 0.25),
        ('cloud-engineer', 'linux-bash', 4, 0.15),
        ('cloud-engineer', 'docker-containers', 4, 0.15),
        ('cloud-engineer', 'kubernetes', 4, 0.15),
        ('cloud-engineer', 'terraform-iac', 4, 0.15),
        ('cloud-engineer', 'cicd-pipelines', 4, 0.10),
        ('cloud-engineer', 'iam-security', 3, 0.05),

        -- Cybersecurity Analyst
        ('cybersecurity-analyst', 'iam-security', 4, 0.20),
        ('cybersecurity-analyst', 'network-security', 4, 0.20),
        ('cybersecurity-analyst', 'threat-detection', 4, 0.20),
        ('cybersecurity-analyst', 'vulnerability-mgmt', 4, 0.15),
        ('cybersecurity-analyst', 'incident-response', 4, 0.15),
        ('cybersecurity-analyst', 'linux-bash', 3, 0.05),
        ('cybersecurity-analyst', 'technical-communication', 3, 0.05)
)
INSERT INTO public.role_skills (role_id, skill_id, required_level, importance_weight)
SELECT cr.id, s.id, m.required_level, m.importance_weight
FROM role_skill_matrix m
JOIN public.career_roles cr ON cr.slug = m.role_slug
JOIN public.skills s ON s.slug = m.skill_slug
ON CONFLICT (role_id, skill_id) DO UPDATE
SET
    required_level = EXCLUDED.required_level,
    importance_weight = EXCLUDED.importance_weight;

-- 4. Initial Demonstration Learning Opportunities (clearly labeled demo_seed)
INSERT INTO public.opportunities (
    id,
    title,
    provider,
    opportunity_type,
    description,
    skill_tags,
    difficulty_level,
    estimated_hours,
    cost_inr,
    format,
    deadline_at,
    url,
    source_type,
    organization_id,
    is_demo
)
VALUES
    (
        '11111111-1111-4111-8111-111111111101',
        '[DEMO] SQL Analytics & Window Functions Lab',
        'SkillPilot Demo Catalog',
        'course',
        'Demonstration course covering relational joins, CTEs, and analytical window functions.',
        ARRAY['sql', 'data-cleaning', 'data-visualization'],
        'beginner',
        12,
        0,
        'self_paced',
        NULL,
        NULL,
        'demo_seed',
        NULL,
        true
    ),
    (
        '11111111-1111-4111-8111-111111111102',
        '[DEMO] Practical Statistics & Experiment Design Workshop',
        'SkillPilot Demo Catalog',
        'workshop',
        'Demonstration hands-on workshop on hypothesis testing, A/B experiments, and p-values.',
        ARRAY['statistics', 'python', 'technical-communication'],
        'intermediate',
        6,
        0,
        'online',
        NULL,
        NULL,
        'demo_seed',
        NULL,
        true
    ),
    (
        '11111111-1111-4111-8111-111111111103',
        '[DEMO] Applied Scikit-Learn Pipelines & Evaluation',
        'SkillPilot Demo Catalog',
        'course',
        'Demonstration track for building reproducible ML pipelines, cross-validation, and feature engineering.',
        ARRAY['python', 'pandas', 'scikit-learn'],
        'intermediate',
        18,
        0,
        'self_paced',
        NULL,
        NULL,
        'demo_seed',
        NULL,
        true
    ),
    (
        '11111111-1111-4111-8111-111111111104',
        '[DEMO] Agentic AI & Embedding Retrieval Build Sprint',
        'SkillPilot Demo Catalog',
        'hackathon',
        'Demonstration weekend build challenge focused on semantic embeddings, FastAPI, and tool calling.',
        ARRAY['nlp-llms', 'fastapi', 'python', 'mlops'],
        'advanced',
        16,
        0,
        'hybrid',
        NULL,
        NULL,
        'demo_seed',
        NULL,
        true
    ),
    (
        '11111111-1111-4111-8111-111111111105',
        '[DEMO] Full-Stack TypeScript & Next.js Testing Studio',
        'SkillPilot Demo Catalog',
        'open_source',
        'Demonstration open-source contribution guide for typed React components and automated test suites.',
        ARRAY['typescript', 'react-nextjs', 'automated-testing', 'git'],
        'intermediate',
        14,
        0,
        'online',
        NULL,
        NULL,
        'demo_seed',
        NULL,
        true
    ),
    (
        '11111111-1111-4111-8111-111111111106',
        '[DEMO] Cloud Containers & Infrastructure-as-Code Lab',
        'SkillPilot Demo Catalog',
        'certification',
        'Demonstration readiness lab covering Docker containers, Terraform state, and CI/CD pipelines.',
        ARRAY['docker-containers', 'terraform-iac', 'aws-cloud', 'cicd-pipelines'],
        'intermediate',
        24,
        3999,
        'self_paced',
        NULL,
        NULL,
        'demo_seed',
        NULL,
        true
    ),
    (
        '11111111-1111-4111-8111-111111111107',
        '[DEMO] Zero-Trust IAM & Threat Detection Tabletop',
        'SkillPilot Demo Catalog',
        'workshop',
        'Demonstration security exercise on JWT verification, RBAC policies, and SIEM triage.',
        ARRAY['iam-security', 'network-security', 'threat-detection', 'incident-response'],
        'intermediate',
        8,
        0,
        'online',
        NULL,
        NULL,
        'demo_seed',
        NULL,
        true
    ),
    (
        '11111111-1111-4111-8111-111111111108',
        '[DEMO] Peer Architecture & Career Mentoring Circle',
        'SkillPilot Demo Catalog',
        'mentoring',
        'Demonstration mentoring cohort for system design reviews and technical storytelling.',
        ARRAY['system-design', 'technical-communication', 'git'],
        'intermediate',
        5,
        0,
        'online',
        NULL,
        NULL,
        'demo_seed',
        NULL,
        true
    )
ON CONFLICT (id) DO UPDATE
SET
    title = EXCLUDED.title,
    provider = EXCLUDED.provider,
    opportunity_type = EXCLUDED.opportunity_type,
    description = EXCLUDED.description,
    skill_tags = EXCLUDED.skill_tags,
    difficulty_level = EXCLUDED.difficulty_level,
    estimated_hours = EXCLUDED.estimated_hours,
    cost_inr = EXCLUDED.cost_inr,
    format = EXCLUDED.format,
    source_type = EXCLUDED.source_type,
    is_demo = EXCLUDED.is_demo;
