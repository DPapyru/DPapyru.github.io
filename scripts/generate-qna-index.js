// scripts/generate-qna-index.js - 生成 assets/qna-index.json（从 GitHub Discussions 拉取）
const fs = require('fs');
const path = require('path');

const GITHUB_GRAPHQL = 'https://api.github.com/graphql';

function parseArgs(argv) {
    const args = { };
    for (let i = 0; i < argv.length; i += 1) {
        const k = argv[i];
        if (!k || !k.startsWith('--')) continue;
        const key = k.slice(2);
        const value = argv[i + 1];
        if (!value || value.startsWith('--')) {
            args[key] = true;
        } else {
            args[key] = value;
            i += 1;
        }
    }
    return args;
}

async function graphqlRequest(token, query, variables) {
    const res = await fetch(GITHUB_GRAPHQL, {
        method: 'POST',
        headers: {
            'Authorization': `bearer ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'qna-index-generator'
        },
        body: JSON.stringify({ query, variables })
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`GitHub GraphQL 请求失败: ${res.status} ${text}`);
    }

    const json = await res.json();
    if (json.errors && json.errors.length) {
        const msg = json.errors.map(e => e && e.message).filter(Boolean).join('; ');
        throw new Error(`GitHub GraphQL 返回错误: ${msg || 'unknown error'}`);
    }
    return json.data;
}

async function getDiscussionCategoryId(token, owner, repo, categoryName) {
    const query = `
        query($owner: String!, $name: String!, $after: String) {
            repository(owner: $owner, name: $name) {
                discussionCategories(first: 100, after: $after) {
                    nodes { id name slug }
                    pageInfo { hasNextPage endCursor }
                }
            }
        }
    `;

    let after = null;
    const target = String(categoryName || '').trim();
    while (true) {
        const data = await graphqlRequest(token, query, { owner, name: repo, after });
        const categories = (data && data.repository && data.repository.discussionCategories) || null;
        const nodes = (categories && categories.nodes) || [];
        const match = nodes.find(n => n && String(n.name) === target);
        if (match && match.id) return match.id;
        const pageInfo = categories && categories.pageInfo;
        if (!pageInfo || !pageInfo.hasNextPage) break;
        after = pageInfo.endCursor;
    }
    throw new Error(`未找到 Discussions 分类: ${target}`);
}

async function getDiscussions(token, owner, repo, categoryId, maxCount) {
    const query = `
        query($owner: String!, $name: String!, $categoryId: ID!, $after: String) {
            repository(owner: $owner, name: $name) {
                discussions(first: 100, after: $after, orderBy: { field: UPDATED_AT, direction: DESC }, categoryId: $categoryId) {
                    nodes {
                        number
                        title
                        url
                        createdAt
                        updatedAt
                        answerChosenAt
                        author { login }
                        comments { totalCount }
                    }
                    pageInfo { hasNextPage endCursor }
                }
            }
        }
    `;

    const out = [];
    let after = null;
    while (out.length < maxCount) {
        const data = await graphqlRequest(token, query, { owner, name: repo, categoryId, after });
        const discussions = data && data.repository && data.repository.discussions;
        const nodes = (discussions && discussions.nodes) || [];
        for (const d of nodes) {
            if (!d || typeof d.number !== 'number') continue;
            out.push({
                number: d.number,
                title: d.title || '',
                url: d.url || '',
                createdAt: d.createdAt || null,
                updatedAt: d.updatedAt || null,
                answerChosenAt: d.answerChosenAt || null,
                author: (d.author && d.author.login) ? d.author.login : '',
                comments: (d.comments && typeof d.comments.totalCount === 'number') ? d.comments.totalCount : 0
            });
            if (out.length >= maxCount) break;
        }
        const pageInfo = discussions && discussions.pageInfo;
        if (!pageInfo || !pageInfo.hasNextPage) break;
        after = pageInfo.endCursor;
    }
    return out;
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const owner = args.owner || 'DPapyru';
    const repo = args.repo || 'DPapyru.github.io';
    const category = args.category || 'Q&A';
    const output = args.output || path.join('assets', 'qna-index.json');
    const limit = args.limit ? parseInt(args.limit, 10) : 200;
    const maxCount = Number.isFinite(limit) && limit > 0 ? limit : 200;

    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.TOKEN;
    if (!token) {
        throw new Error('缺少 token：请设置环境变量 GITHUB_TOKEN（或 GH_TOKEN）');
    }

    const categoryId = await getDiscussionCategoryId(token, owner, repo, category);
    const discussions = await getDiscussions(token, owner, repo, categoryId, maxCount);

    const payload = {
        version: 1,
        generatedAt: new Date().toISOString(),
        source: {
            owner,
            repo,
            category,
            categoryId
        },
        count: discussions.length,
        items: discussions
    };

    fs.writeFileSync(output, JSON.stringify(payload, null, 4) + '\n', 'utf8');
    console.log(`已生成 ${output}，共 ${payload.count} 条`);
}

main().catch(err => {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});

