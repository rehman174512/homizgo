import { createClient } from './supabase'

const supabase = createClient()

/**
 * Fetch all reviews for a property, joined with user names.
 * @param {string} propertyId
 * @returns {Promise<Array>}
 */
export async function getReviews(propertyId) {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      id,
      property_id,
      user_id,
      rating,
      comment,
      created_at,
      updated_at,
      users!reviews_user_id_fkey ( name )
    `)
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data || []).map((r) => ({
    id: r.id,
    propertyId: r.property_id,
    userId: r.user_id,
    rating: r.rating,
    comment: r.comment || '',
    userName: r.users?.name || 'Anonymous',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }))
}

/**
 * Upsert a review for the current user + property.
 * Enforces one review per user per property via DB unique constraint.
 * @param {string} propertyId
 * @param {string} userId
 * @param {number} rating  1–5
 * @param {string} comment
 * @returns {Promise<Object>}
 */
export async function upsertReview(propertyId, userId, rating, comment) {
  const { data, error } = await supabase
    .from('reviews')
    .upsert(
      { property_id: propertyId, user_id: userId, rating, comment },
      { onConflict: 'property_id,user_id' }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a review by id. RLS ensures only the owner can delete.
 * @param {string} reviewId
 */
export async function deleteReview(reviewId) {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)

  if (error) throw error
}
