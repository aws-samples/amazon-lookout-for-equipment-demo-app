/***************************************************
 * This function loops through a list of S3 prefixes 
 * and filter out all files to keep only the folders
 ***************************************************/
export function listFolders(results) {
    let folders = new Set();

    results.forEach(item => {
      if (item.size) {
        // Sometimes files declare a folder with a / within them:
        let possibleFolder = item.key
          .split('/')
          .slice(0, -1)
          .join('/')

        if (possibleFolder) { folders.add(possibleFolder) }
      } 
      else {
        folders.add(item.key)
      }
    })

    return folders
}