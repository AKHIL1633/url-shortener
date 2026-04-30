import { generateSlug, isValidUrl, hashUrl } from '@/lib/utils'

describe('isValidUrl', () => {
  it('should return true for valid https URL', () => {
    expect(isValidUrl('https://google.com')).toBe(true)
  })

  it('should return true for valid http URL', () => {
    expect(isValidUrl('http://example.com')).toBe(true)
  })

  it('should return false for invalid URL', () => {
    expect(isValidUrl('not-a-url')).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(isValidUrl('')).toBe(false)
  })

  it('should return false for ftp protocol', () => {
    expect(isValidUrl('ftp://example.com')).toBe(false)
  })
})

describe('generateSlug', () => {
  it('should generate a string', () => {
    expect(typeof generateSlug()).toBe('string')
  })

  it('should generate slug of length 7', () => {
    expect(generateSlug()).toHaveLength(7)
  })

  it('should generate unique slugs', () => {
    const slug1 = generateSlug()
    const slug2 = generateSlug()
    expect(slug1).not.toBe(slug2)
  })
})

describe('hashUrl', () => {
  it('should return a string', () => {
    expect(typeof hashUrl('https://google.com')).toBe('string')
  })

  it('should return same hash for same URL', () => {
    const url = 'https://google.com'
    expect(hashUrl(url)).toBe(hashUrl(url))
  })

  it('should return different hash for different URLs', () => {
    expect(hashUrl('https://google.com')).not.toBe(hashUrl('https://github.com'))
  })
})