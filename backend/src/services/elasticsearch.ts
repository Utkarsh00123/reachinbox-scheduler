import { Client } from '@elastic/elasticsearch';
import { config } from '../config';
import { prisma } from './db';

let esClient: Client | null = null;
const INDEX_NAME = 'reachinbox_emails';

export async function getElasticsearchClient(): Promise<Client | null> {
  if (!config.elasticsearchUrl) {
    return null;
  }
  if (esClient) {
    return esClient;
  }

  try {
    esClient = new Client({ node: config.elasticsearchUrl });
    const ping = await esClient.ping();
    if (ping) {
      console.log(`[Elasticsearch] Connected to ${config.elasticsearchUrl}`);
      await ensureIndexExists();
      return esClient;
    }
  } catch (err: any) {
    console.warn(`[Elasticsearch] Connection warning:`, err.message || err);
  }
  return null;
}

async function ensureIndexExists() {
  if (!esClient) return;
  try {
    const exists = await esClient.indices.exists({ index: INDEX_NAME });
    if (!exists) {
      await esClient.indices.create({
        index: INDEX_NAME,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              userId: { type: 'keyword' },
              senderEmail: { type: 'keyword' },
              recipient: { type: 'text' },
              subject: { type: 'text' },
              body: { type: 'text' },
              status: { type: 'keyword' },
              scheduledAt: { type: 'date' },
              sentAt: { type: 'date' },
            },
          },
        },
      });
      console.log(`[Elasticsearch] Index '${INDEX_NAME}' created.`);
    }
  } catch (err: any) {
    console.warn('[Elasticsearch] ensureIndexExists warning:', err.message || err);
  }
}

export async function indexEmail(emailDoc: {
  id: string;
  userId: string;
  senderEmail: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  scheduledAt: Date;
  sentAt?: Date | null;
}) {
  const client = await getElasticsearchClient();
  if (!client) {
    // Elasticsearch not connected, DB is primary store
    return;
  }

  try {
    await client.index({
      index: INDEX_NAME,
      id: emailDoc.id,
      document: {
        id: emailDoc.id,
        userId: emailDoc.userId,
        senderEmail: emailDoc.senderEmail,
        recipient: emailDoc.recipient,
        subject: emailDoc.subject,
        body: emailDoc.body,
        status: emailDoc.status,
        scheduledAt: emailDoc.scheduledAt.toISOString(),
        sentAt: emailDoc.sentAt ? emailDoc.sentAt.toISOString() : null,
      },
    });
    console.log(`[Elasticsearch] Indexed email ${emailDoc.id}`);
  } catch (err: any) {
    console.warn(`[Elasticsearch] Failed to index email:`, err.message || err);
  }
}

export async function searchEmails({
  userId,
  query,
  status,
}: {
  userId: string;
  query?: string;
  status?: string;
}) {
  const client = await getElasticsearchClient();

  if (client) {
    try {
      const mustClauses: any[] = [{ term: { userId } }];
      if (status) {
        mustClauses.push({ term: { status } });
      }
      if (query && query.trim()) {
        mustClauses.push({
          multi_match: {
            query: query.trim(),
            fields: ['recipient', 'subject', 'body', 'senderEmail'],
            fuzziness: 'AUTO',
          },
        });
      }

      const result = await client.search({
        index: INDEX_NAME,
        body: {
          query: {
            bool: {
              must: mustClauses,
            },
          },
          sort: [{ scheduledAt: { order: 'desc' } }],
        },
      });

      return result.hits.hits.map((hit) => hit._source);
    } catch (err: any) {
      console.warn('[Elasticsearch] Search query failed, falling back to SQL search:', err.message);
    }
  }

  // Fallback SQL database search
  const whereClause: any = {
    userId,
  };

  if (status) {
    whereClause.status = status;
  }

  if (query && query.trim()) {
    const q = query.trim();
    whereClause.OR = [
      { recipient: { contains: q } },
      { subject: { contains: q } },
      { body: { contains: q } },
      { senderEmail: { contains: q } },
    ];
  }

  const emails = await prisma.emailSchedule.findMany({
    where: whereClause,
    orderBy: { scheduledAt: 'desc' },
  });

  return emails;
}
